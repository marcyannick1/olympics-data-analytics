"""
Migration helper: extract useful fields from JSONB `extra` (on `results`) into proper `results` table columns.

Usage:
    python migrate_extra.py

What it does:
- Adds result-specific columns to `results` if missing (participant/team/country, sport, event, medal)
- Copies values from `results.extra` into those columns when NULL
- Fills athletes.age when a valid birth year is found in extra

Safe and idempotent.
"""

import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
import math
import json

BASE = Path(__file__).resolve().parent.parent
load_dotenv(BASE / '.env')

DSN = dict(
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
)


def get_conn():
    return psycopg2.connect(**{k: v for k, v in DSN.items() if v})


def ensure_columns(conn):
    cur = conn.cursor()
    columns = [
        "discipline_title TEXT",
        "slug_game TEXT",
        "event_title TEXT",
        "event_gender TEXT",
        "medal_type TEXT",
        "participant_type TEXT",
        "participant_title TEXT",
        "athlete_url TEXT",
        "athlete_full_name TEXT",
        "country_name TEXT",
        "country_code TEXT",
        "country_3_letter_code TEXT"
    ]
    for col in columns:
        cur.execute(f"ALTER TABLE results ADD COLUMN IF NOT EXISTS {col};")
    conn.commit()


def sanitize_json(data):
    """Remove NaN / Infinity values that break psycopg2 JSON decoding."""
    if isinstance(data, float) and (math.isnan(data) or math.isinf(data)):
        return None
    if isinstance(data, dict):
        return {k: sanitize_json(v) for k, v in data.items()}
    if isinstance(data, list):
        return [sanitize_json(v) for v in data]
    return data


def migrate_from_results_extra(conn):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT id, athlete_id, extra
        FROM results
        WHERE extra IS NOT NULL;
    """)
    rows = cur.fetchall()
    print(f"Found {len(rows)} results with extra to inspect")

    updated_results = 0
    updated_athletes = 0

    for r in rows:
        extra = sanitize_json(r['extra']) or {}
        if not isinstance(extra, dict):
            continue

        def pick(*keys):
            for k in keys:
                v = extra.get(k)
                if v is not None and str(v).strip() != '' and str(v).lower() != 'nan':
                    return v
            if 'country' in extra and isinstance(extra['country'], dict):
                for k in ('name', 'country_name', 'code', 'iso3', 'alpha3'):
                    v = extra['country'].get(k)
                    if v:
                        return v
            return None

        # extract fields
        updates = {
            'discipline_title': pick('discipline_title', 'discipline', 'sport'),
            'slug_game': pick('slug_game', 'game_slug', 'game'),
            'event_title': pick('event_title', 'event', 'event_name'),
            'event_gender': pick('event_gender', 'gender', 'sex'),
            'medal_type': pick('medal_type', 'medal'),
            'participant_type': pick('participant_type', 'participant'),
            'participant_title': pick('participant_title', 'team', 'participant_name'),
            'athlete_url': pick('athlete_url', 'athlete_uri'),
            'athlete_full_name': pick('athlete_full_name', 'athlete_name', 'full_name'),
            'country_name': pick('country_name', 'country', 'nation'),
            'country_code': pick('country_code', 'iso2'),
            'country_3_letter_code': pick('country_3_letter_code', 'iso3'),
        }

        # update results only when columns are empty
        set_clauses = []
        params = []
        for k, v in updates.items():
            if v:
                set_clauses.append(f"{k} = CASE WHEN {k} IS NULL OR trim({k}) = '' THEN %s ELSE {k} END")
                params.append(v)

        if set_clauses:
            params.append(r['id'])
            sql = f"UPDATE results SET {', '.join(set_clauses)} WHERE id = %s"
            cur.execute(sql, params)
            updated_results += cur.rowcount

        # birth year → fill athlete age (if valid)
        birth_year = pick('athlete_year_birth', 'birth_year', 'year_of_birth')
        if birth_year and r.get('athlete_id'):
            try:
                birth_year = int(str(birth_year).strip())
            except Exception:
                birth_year = None
            if birth_year and 1800 <= birth_year <= datetime.now().year:
                age = datetime.now().year - birth_year
                cur.execute(
                    "UPDATE athletes SET age = CASE WHEN age IS NULL OR age = 0 THEN %s ELSE age END WHERE id = %s",
                    (age, r['athlete_id'])
                )
                updated_athletes += cur.rowcount

    conn.commit()
    print(f"Updated results: {updated_results}, Updated athletes: {updated_athletes}")


def main():
    conn = get_conn()
    ensure_columns(conn)
    migrate_from_results_extra(conn)
    conn.close()


if __name__ == '__main__':
    main()
