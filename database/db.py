import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

BASE = Path(__file__).resolve().parent.parent


def load_env(env_path: str = None):
    if env_path:
        load_dotenv(env_path)
    else:
        load_dotenv(BASE / '.env')


def get_conn():
    load_env()
    host = os.getenv('DB_HOST')
    port = os.getenv('DB_PORT')
    db = os.getenv('DB_NAME')
    user = os.getenv('DB_USER')
    pwd = os.getenv('DB_PASSWORD')
    if not all([host, port, db, user, pwd]):
        raise RuntimeError('DB configuration incomplete in .env')
    return psycopg2.connect(host=host, port=port, dbname=db, user=user, password=pwd)


def create_tables_from_sql(conn, sql_path: Path):
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()


def insert_host(conn, host):
    sql = (
        "INSERT INTO hosts (game_slug, game_name, game_location, game_season, game_year, game_start_date, game_end_date) "
        "VALUES (%(game_slug)s, %(game_name)s, %(game_location)s, %(game_season)s, %(game_year)s, %(game_start_date)s, %(game_end_date)s) "
        "ON CONFLICT (game_slug) DO UPDATE SET "
        "game_name = EXCLUDED.game_name, "
        "game_location = EXCLUDED.game_location, "
        "game_season = EXCLUDED.game_season, "
        "game_year = EXCLUDED.game_year, "
        "game_start_date = EXCLUDED.game_start_date, "
        "game_end_date = EXCLUDED.game_end_date;"
    )
    with conn.cursor() as cur:
        cur.execute(sql, host)
    conn.commit()


def ensure_host_exists(conn, game_slug):
    """
    Vérifie que le host existe dans la table hosts, sinon le crée.
    Permet d’éviter une erreur FOREIGN KEY lors de l’insertion dans results.
    """
    if not game_slug:
        return
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM hosts WHERE game_slug = %s", (game_slug,))
        exists = cur.fetchone()
        if not exists:
            cur.execute("""
                INSERT INTO hosts (game_slug, game_name, game_location, game_season, game_year)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (game_slug) DO NOTHING
            """, (game_slug, game_slug.title(), 'Unknown', 'Unknown', None))
    conn.commit()


def get_or_create_athlete(conn, athlete):
    """Insert athlete if not exists. athlete is dict containing ref_id (optional), name, sex, age, height, weight, team, noc"""
    with conn.cursor() as cur:
        # Ensure we have a non-empty name (DB enforces NOT NULL)
        name = athlete.get('name')
        if not name:
            raise ValueError('Athlete name is required to insert into athletes table')
        # normalize name and team (trim, collapse spaces)
        name = ' '.join(str(name).split())
        team = athlete.get('team')
        team = ' '.join(str(team).split()) if team else None

        # Try matching by ref_id first
        if athlete.get('ref_id'):
            cur.execute('SELECT id FROM athletes WHERE ref_id = %s', (athlete['ref_id'],))
            row = cur.fetchone()
            if row:
                return row[0]

        # Try matching by normalized name + team (case-insensitive)
        cur.execute("SELECT id FROM athletes WHERE lower(name) = lower(%s) AND lower(COALESCE(team, '')) = lower(COALESCE(%s, ''))", (name, team))
        row = cur.fetchone()
        if row:
            return row[0]

        # Insert new athlete
        cur.execute(
            'INSERT INTO athletes (ref_id, name, sex, age, height, weight, team, noc) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id',
            (
                athlete.get('ref_id'),
                name,
                athlete.get('sex'),
                athlete.get('age'),
                athlete.get('height'),
                athlete.get('weight'),
                team,
                athlete.get('noc'),
            ),
        )
        new_id = cur.fetchone()[0]
    conn.commit()
    return new_id


def insert_result(conn, result):
    # Vérifie que le host correspondant existe avant insertion
    ensure_host_exists(conn, result['game_slug'])

    sql = (
        'INSERT INTO results (athlete_id, game_slug, year, season, city, sport, event, medal, extra) '
        'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) '
        'ON CONFLICT (athlete_id, game_slug, sport, event) DO UPDATE SET '
        'medal = EXCLUDED.medal, extra = EXCLUDED.extra '
        'RETURNING id'
    )
    with conn.cursor() as cur:
        cur.execute(sql, (
            result['athlete_id'],
            result['game_slug'],
            result.get('year'),
            result.get('season'),
            result.get('city'),
            result.get('sport'),
            result.get('event'),
            result.get('medal'),
            psycopg2.extras.Json(result.get('extra') or {})
        ))
        rid = cur.fetchone()[0]
    conn.commit()
    return rid


def insert_medal_if_any(conn, result_id, athlete_id, game_slug, medal):
    if not medal or medal in ('NA', 'None', ''):
        return None

    m = medal.capitalize()
    if m not in ('Gold', 'Silver', 'Bronze'):
        # try to map shorter values
        if m.lower().startswith('g'):
            m = 'Gold'
        elif m.lower().startswith('s'):
            m = 'Silver'
        elif m.lower().startswith('b'):
            m = 'Bronze'
        else:
            return None

    # Vérifie aussi que le host existe avant insertion de la médaille
    ensure_host_exists(conn, game_slug)

    with conn.cursor() as cur:
        cur.execute('SELECT id FROM medals WHERE result_id = %s', (result_id,))
        if cur.fetchone():
            return None
        cur.execute(
            'INSERT INTO medals (result_id, athlete_id, game_slug, medal_type) VALUES (%s,%s,%s,%s) RETURNING id',
            (result_id, athlete_id, game_slug, m)
        )
        mid = cur.fetchone()[0]
    conn.commit()
    return mid
