from pathlib import Path
import json
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from db import get_conn, create_tables_from_sql, insert_host, get_or_create_athlete, insert_result, insert_medal_if_any
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


def ingest_athletes_and_results(conn, path: Path):
    print('Ingesting athletes/results from', path)
    text = path.read_text(encoding='utf-8')
    data = None
    try:
        data = json.loads(text)
    except Exception:
        data = []
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                data.append(json.loads(line))
            except Exception:
                pass

    if not data:
        print('No JSON data parsed from', path)
        return

    total = 0
    skipped = 0
    inserted = 0
    for rec in data:
        total += 1
        name = rec.get('Name') or rec.get('name') or rec.get('Athlete') or rec.get('athlete')
        if not name:
            first = rec.get('First Name') or rec.get('FirstName') or rec.get('firstname')
            last = rec.get('Last Name') or rec.get('LastName') or rec.get('lastname')
            if first or last:
                name = ' '.join([p for p in (first, last) if p])
        if not name:
            name = rec.get('athlete_full_name') or rec.get('full_name') or rec.get('athleteName')

        participant_type = rec.get('participant_type') or rec.get('participantType')
        if not name and participant_type and participant_type.lower().startswith('gameteam'):
            name = rec.get('participant_title') or rec.get('team') or rec.get('country_name') or rec.get('participant')

        athlete = {
            'ref_id': rec.get('ID') or rec.get('Id') or rec.get('id') or None,
            'name': name,
            'sex': rec.get('Sex') or rec.get('sex') or rec.get('Gender'),
            'age': safe_int(rec.get('Age')),
            'height': rec.get('Height') or rec.get('height'),
            'weight': rec.get('Weight') or rec.get('weight'),
            'team': rec.get('Team') or rec.get('team') or rec.get('Country'),
            'noc': rec.get('NOC') or rec.get('noc'),
        }

        if not athlete['age']:
            birth_year = rec.get('athlete_year_birth') or rec.get('birth_year') or rec.get('year_of_birth')
            year_field = rec.get('Year') or rec.get('year')
            try:
                if birth_year and year_field:
                    athlete['age'] = safe_int(int(year_field) - int(birth_year))
            except Exception:
                pass

        if not athlete['name']:
            skipped += 1
            print('Warning: skipping athlete record with missing name; record keys:', list(rec.keys()))
            continue
        try:
            athlete_id = get_or_create_athlete(conn, athlete)
        except ValueError as e:
            skipped += 1
            print('Skipping athlete due to error:', e)
            continue
        inserted += 1

        # Génération du slug
        game_slug = generate_game_slug(rec)

        res = {
            'athlete_id': athlete_id,
            'game_slug': game_slug,
            'year': safe_int(rec.get('Year') or rec.get('year')),
            'season': rec.get('Season') or rec.get('season'),
            'city': rec.get('City') or rec.get('city'),
            'sport': rec.get('Sport') or rec.get('sport'),
            'event': rec.get('Event') or rec.get('event'),
            'medal': rec.get('Medal') or rec.get('medal'),
            'extra': {k: v for k, v in rec.items() if k not in [
                'ID','Id','id','Name','name','Athlete','athlete','Sex','sex','Age','age','Height','height',
                'Weight','weight','Team','team','NOC','noc','Games','games','Game','Year','year','Season',
                'season','City','city','Sport','sport','Event','event','Medal','medal']}
        }
        result_id = insert_result(conn, res)
        insert_medal_if_any(conn, result_id, athlete_id, game_slug, res.get('medal'))

    print(f'athletes ingestion: total={total}, inserted={inserted}, skipped={skipped}')


def ingest_results_html(conn, path: Path):
    print('Ingesting results HTML from', path)
    html = path.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    table = soup.find('table')
    rows = []
    if table:
        headers = []
        thead = table.find('thead')
        if thead:
            headers = [th.get_text(strip=True) for th in thead.find_all('th')]
        else:
            first = table.find('tr')
            if first:
                headers = [th.get_text(strip=True) for th in first.find_all(['th', 'td'])]
        for tr in table.find_all('tr'):
            cells = [td.get_text(strip=True) for td in tr.find_all('td')]
            if not cells:
                continue
            if headers and len(headers) == len(cells):
                row = dict(zip(headers, cells))
            else:
                row = {f'col_{i}': v for i, v in enumerate(cells)}
            rows.append(row)
    else:
        print('No table found in HTML')

    for r in rows:
        athlete = {
            'ref_id': None,
            'name': r.get('Name') or r.get('Athlete') or r.get('Athlete Name') or r.get('col_1') or r.get('athlete_full_name'),
            'sex': r.get('Sex'),
            'age': None,
            'height': None,
            'weight': None,
            'team': r.get('Team') or r.get('Nation') or r.get('col_2'),
            'noc': r.get('NOC')
        }
        if not athlete['name']:
            print('Warning: skipping HTML row with missing athlete name; row keys:', list(r.keys()))
            continue
        try:
            athlete_id = get_or_create_athlete(conn, athlete)
        except ValueError as e:
            print('Skipping HTML row due to error creating athlete:', e)
            continue
        res = {
            'athlete_id': athlete_id,
            'game_slug': generate_game_slug(r),
            'year': None,
            'season': None,
            'city': None,
            'sport': r.get('Sport') or r.get('col_3'),
            'event': r.get('Event') or r.get('col_4'),
            'medal': r.get('Medal') or r.get('col_5'),
            'extra': r
        }
        result_id = insert_result(conn, res)
        insert_medal_if_any(conn, result_id, athlete_id, res.get('game_slug'), res.get('medal'))


def ingest_medals(conn, path: Path):
    print('Ingesting medals from', path)
    try:
        df = pd.read_excel(path)
    except Exception as e:
        print('Erreur de lecture Excel:', e)
        return

    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

    total = 0
    inserted = 0
    for _, row in df.iterrows():
        total += 1
        athlete_name = row.get('athlete_name') or row.get('name')
        noc = row.get('noc') or row.get('country')
        game_slug = row.get('game_slug') or row.get('games')
        medal_type = row.get('medal') or row.get('medal_type')

        if not athlete_name or not medal_type:
            continue

        athlete = {
            'ref_id': None,
            'name': athlete_name,
            'sex': None,
            'age': None,
            'height': None,
            'weight': None,
            'team': None,
            'noc': noc
        }
        try:
            athlete_id = get_or_create_athlete(conn, athlete)
        except ValueError as e:
            print('Skipping medal record due to athlete error:', e)
            continue

        res = {
            'athlete_id': athlete_id,
            'game_slug': game_slug or generate_game_slug(row),
            'year': safe_int(row.get('year')),
            'season': row.get('season'),
            'city': row.get('city'),
            'sport': row.get('sport'),
            'event': row.get('event'),
            'medal': medal_type,
            'extra': row.to_dict()
        }
        result_id = insert_result(conn, res)
        insert_medal_if_any(conn, result_id, athlete_id, res['game_slug'], medal_type)
        inserted += 1

    print(f'medals ingestion: total={total}, inserted={inserted}')


def main():
    conn = get_conn()
    create_tables_from_sql(conn, SQL_INIT)

    hosts = DATASET / 'olympic_hosts.xml'
    athletes = DATASET / 'olympic_athletes.json'
    results = DATASET / 'olympic_results.html'
    medals = DATASET / 'olympic_medals.xlsx'

    if hosts.exists():
        ingest_hosts(conn, hosts)
    else:
        print('Hosts file not found:', hosts)

    if athletes.exists():
        ingest_athletes_and_results(conn, athletes)
    else:
        print('Athletes file not found:', athletes)

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
