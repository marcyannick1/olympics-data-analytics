from pathlib import Path
import json
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from db import (
    get_conn,
    create_tables_from_sql,
    insert_host,
    get_or_create_athlete,
    insert_result,
    insert_medal_if_any,
    ensure_host_exists
)
from datetime import datetime
import pandas as pd
import re


BASE = Path(__file__).resolve().parent.parent
DATASET = BASE / 'dataset'
SQL_INIT = BASE / 'database' / 'init_db.sql'


def parse_iso_date(val):
    if not val:
        return None
    try:
        return datetime.fromisoformat(val.replace('Z', '+00:00'))
    except Exception:
        return None


def safe_int(v):
    try:
        return int(v)
    except Exception:
        return None


def generate_game_slug(rec):
    """
    Génère un slug unique pour les Jeux à partir des infos disponibles.
    Exemple : 'Tokyo', 2020 -> 'tokyo-2020'
    """
    games_field = rec.get('Games') or rec.get('games') or rec.get('Game')
    if games_field:
        return re.sub(r'\s+', '-', games_field.strip().lower())

    city = rec.get('City') or rec.get('city')
    year = rec.get('Year') or rec.get('year')
    if city and year:
        return f"{city.strip().lower().replace(' ', '-')}-{year}"

    if year:
        return f"unknown-{year}"

    return "unknown"


def ingest_hosts(conn, path: Path):
    print('Ingesting hosts from', path)
    tree = ET.parse(str(path))
    root = tree.getroot()
    rows = root.findall('.//row')
    for r in rows:
        g = {}
        for child in list(r):
            tag = child.tag
            text = child.text.strip() if child.text else None
            g[tag] = text
        host = {
            'game_slug': g.get('game_slug'),
            'game_name': g.get('game_name'),
            'game_location': g.get('game_location'),
            'game_season': g.get('game_season'),
            'game_year': int(g['game_year']) if g.get('game_year') else None,
            'game_start_date': parse_iso_date(g.get('game_start_date')),
            'game_end_date': parse_iso_date(g.get('game_end_date')),
        }
        if host['game_slug']:
            insert_host(conn, host)


# --- NEW: Clean ingestion of athlete metadata JSON ---
def ingest_athletes_json(conn, path: Path):
    print('Ingesting base athlete data from', path)
    text = path.read_text(encoding='utf-8')
    try:
        data = json.loads(text)
    except Exception as e:
        print('Error parsing JSON:', e)
        return

    if not isinstance(data, list):
        print('Invalid JSON structure: expected list of athletes')
        return

    total = 0
    inserted = 0
    skipped = 0

    for rec in data:
        total += 1
        name = rec.get('athlete_full_name')
        if not name or len(name.strip()) < 2:
            skipped += 1
            continue

        birth_year = rec.get('athlete_year_birth')
        age = None
        if birth_year:
            try:
                age = datetime.now().year - int(birth_year)
            except Exception:
                pass

        first_game = rec.get('first_game')
        game_slug = None
        if first_game:
            parts = first_game.strip().split()
            if len(parts) == 2:
                city, year = parts
                game_slug = f"{city.lower()}-{year}"
                try:
                    ensure_host_exists(conn, game_slug)
                except Exception:
                    pass

        athlete = {
            'ref_id': None,
            'name': name.strip(),
            'sex': None,
            'age': age,
            'height': None,
            'weight': None,
            'team': None,
            'noc': None,
        }

        try:
            athlete_id = get_or_create_athlete(conn, athlete)
            inserted += 1
        except Exception as e:
            skipped += 1
            print(f"Skipping athlete {name} due to error: {e}")
            continue

        # Mise à jour des infos additionnelles
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE athletes
                SET profile_url = %s,
                    bio = %s,
                    games_participations = %s
                WHERE id = %s
            """, (
                rec.get('athlete_url'),
                rec.get('bio'),
                rec.get('games_participations'),
                athlete_id
            ))
        conn.commit()

    print(f"JSON athletes ingestion complete: total={total}, inserted={inserted}, skipped={skipped}")


# --- Ingest results HTML (standardized columns) ---
def ingest_results_html(conn, path: Path):
    print('Ingesting results HTML from', path)
    html = path.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    table = soup.find('table')
    if not table:
        print('No table found in HTML')
        return

    headers = [th.get_text(strip=True) for th in table.find_all('th')]
    rows_data = []
    for tr in table.find_all('tr')[1:]:
        cells = [td.get_text(strip=True) for td in tr.find_all('td')]
        if not cells or len(cells) != len(headers):
            continue
        row = dict(zip(headers, cells))
        rows_data.append(row)

    INVALID_NAME_PATTERN = re.compile(
        r'(?i)\b(men|women|mixed|relay|team|aerial|freestyle|cross|mogul|pipe|slopestyle|snowboard|ski|event)\b'
    )

    def looks_like_game_slug(val: str) -> bool:
        return bool(val and re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)+-\d{4}$', val))

    inserted = 0
    skipped = 0
    for rec in rows_data:
        name = rec.get('athlete_full_name') or rec.get('athletes') or rec.get('participant_title')
        if not name or INVALID_NAME_PATTERN.search(name):
            skipped += 1
            continue

        is_team = rec.get('participant_type') and 'TEAM' in rec.get('participant_type').upper()

        if is_team:
            team_val = rec.get('country_name') or rec.get('participant_title')
            athlete = {
                'name': team_val,
                'team': team_val,
                'noc': rec.get('country_3_letter_code') or rec.get('country_code'),
                'ref_id': None,
            }
        else:
            athlete = {
                'name': name,
                'team': rec.get('country_name'),
                'noc': rec.get('country_3_letter_code') or rec.get('country_code'),
                'ref_id': None,
            }

        try:
            athlete_id = get_or_create_athlete(conn, athlete)
        except ValueError as e:
            print('Skipping invalid athlete:', e)
            continue

        slug = rec.get('slug_game')
        if slug:
            try:
                ensure_host_exists(conn, slug)
            except Exception as e:
                print(f"Host missing: {slug} ({e})")

        result = {
            'athlete_id': athlete_id,
            'game_slug': slug,
            'year': None,
            'season': None,
            'city': None,
            'sport': rec.get('discipline_title'),
            'event': rec.get('event_title'),
            'medal': rec.get('medal_type'),
            'extra': rec,
        }

        result_id = insert_result(conn, result)
        insert_medal_if_any(conn, result_id, athlete_id, slug, rec.get('medal_type'))
        inserted += 1

    print(f'Results HTML ingestion complete: inserted={inserted}, skipped={skipped}')


# --- Ingest medals XLSX (clean & consistent) ---
def ingest_medals(conn, path: Path):
    print('Ingesting medals from', path)
    try:
        df = pd.read_excel(path)
    except Exception as e:
        print('Erreur de lecture Excel:', e)
        return

    # Normaliser les colonnes
    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

    total = 0
    inserted = 0

    for _, row in df.iterrows():
        total += 1

        athlete_name = row.get('athlete_full_name') or row.get('athlete_name') or row.get('name')
        noc = row.get('country_code') or row.get('noc') or row.get('country_3_letter_code') or row.get('country')
        game_slug = row.get('slug_game') or row.get('game_slug') or row.get('games')
        medal_type = row.get('medal_type') or row.get('medal') or row.get('medaltype')

        if not athlete_name or not medal_type:
            continue

        # Nettoyage du dict pour JSON
        clean_dict = {
            k: (None if pd.isna(v) or str(v).strip().lower() in ['nan', 'na', 'none'] else v)
            for k, v in row.to_dict().items()
        }

       # Vérification du nom d'athlète
        if isinstance(athlete_name, float) or pd.isna(athlete_name):
            # ignorer les lignes sans nom valide
            continue
        
        athlete_name = str(athlete_name).strip()
        if not athlete_name:
            continue
        
        athlete = {
            'ref_id': None,
            'name': athlete_name,
            'sex': None,
            'age': None,
            'height': None,
            'weight': None,
            'team': clean_dict.get('participant_title') or clean_dict.get('country_name'),
            'noc': noc,
        }
        

        try:
            athlete_id = get_or_create_athlete(conn, athlete)
        except ValueError as e:
            print('Skipping medal record due to athlete error:', e)
            continue

        res = {
            'athlete_id': athlete_id,
            'game_slug': game_slug or 'unknown',
            'year': safe_int(row.get('year')),
            'season': row.get('season'),
            'city': row.get('city'),
            'sport': row.get('discipline_title') or row.get('sport'),
            'event': row.get('event_title') or row.get('event'),
            'medal': medal_type,
            'extra': clean_dict,
        }

        result_id = insert_result(conn, res)
        insert_medal_if_any(conn, result_id, athlete_id, res['game_slug'], medal_type)
        inserted += 1

    print(f'medals ingestion: total={total}, inserted={inserted}')



# --- Main orchestration ---
def main():
    conn = get_conn()
    create_tables_from_sql(conn, SQL_INIT)

    hosts = DATASET / 'olympic_hosts.xml'
    athletes = DATASET / 'olympic_athletes.json'
    results = DATASET / 'olympic_results.html'
    medals = DATASET / 'olympic_medals.xlsx'

    # if hosts.exists():
    #     ingest_hosts(conn, hosts)
    # else:
    #     print('Hosts file not found:', hosts)

    # if athletes.exists():
    #     ingest_athletes_json(conn, athletes)
    # else:
    #     print('Athletes file not found:', athletes)

    if results.exists():
        ingest_results_html(conn, results)
    else:
        print('Results HTML file not found:', results)

    if medals.exists():
        ingest_medals(conn, medals)
    else:
        print('Medals file not found:', medals)

    conn.close()


if __name__ == '__main__':
    main()
