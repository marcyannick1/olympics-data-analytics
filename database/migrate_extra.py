"""Migration helper: extract useful fields from JSONB `extra` (on `results`) into proper `results` table columns.

Run this locally (after backing up your DB):

    python migrate_extra.py

What it does:
- Adds result-specific columns to `results` if missing (participant/team/country, sport, event, medal)
- Copies values from `results.extra` into those `results` columns when the target columns are NULL

This script is idempotent and conservative: it only fills NULL fields on `results` and
will also fill `athletes.age` from `results.extra` when a valid birth year is found.
"""

import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from pathlib import Path


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
    # Add result-specific columns to store participant/team metadata that was stored in extra
    # Ensure columns named as in the spreadsheet exist on `results`.
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS discipline_title TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS slug_game TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS event_title TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS event_gender TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS medal_type TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS participant_type TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS participant_title TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS athlete_url TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS athlete_full_name TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS country_name TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS country_code TEXT;")
    cur.execute("ALTER TABLE results ADD COLUMN IF NOT EXISTS country_3_letter_code TEXT;")
    conn.commit()


def migrate_from_results_extra(conn):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Select results where extra contains athlete_* or event metadata
    cur.execute("SELECT id, athlete_id, year, extra, medal, discipline_title, event_title, medal_type, athlete_full_name, athlete_url FROM results WHERE extra IS NOT NULL;")
    rows = cur.fetchall()
    print(f'Found {len(rows)} results with extra to inspect')

    updated_results = 0
    updated_athletes = 0

    for r in rows:
        extra = r['extra'] or {}
        if not isinstance(extra, dict):
            continue
        # helper to pick the first non-empty candidate from extra (supports synonyms and nested dicts)
        def pick(*keys):
            for k in keys:
                v = extra.get(k)
                if v is not None and str(v).strip() != '':
                    return v
            # handle nested country object like extra['country'] = { 'name': ..., 'code': ... }
            if 'country' in extra and isinstance(extra['country'], dict):
                for k in ('name', 'country_name', 'code', 'iso3', 'alpha3'):
                    v = extra['country'].get(k)
                    if v is not None and str(v).strip() != '':
                        return v
            return None

        # build candidate values using multiple possible keys, trying to match spreadsheet column names
        res_updates = {}
        discipline_val = pick('discipline_title', 'discipline', 'sport', 'sport_title')
        slug_game_val = pick('slug_game', 'game_slug', 'game')
        event_title_val = pick('event_title', 'event', 'event_name')
        event_gender_val = pick('event_gender', 'gender', 'sex')
        medal_type_val = pick('medal_type', 'medal', 'medal_type')
        participant_type_val = pick('participant_type', 'participant', 'participant_type')
        participant_title_val = pick('participant_title', 'participant_name', 'participant_title', 'name')
        athlete_url_val = pick('athlete_url', 'athlete_uri', 'athlete_link', 'athlete_url')
        athlete_full_name_val = pick('athlete_full_name', 'athlete_name', 'full_name', 'name')
        country_name_val = pick('country_name', 'country', 'country_full')
        country_code_val = pick('country_code', 'country_iso2', 'iso2', 'country_code')
        country_3_val = pick('country_3_letter_code', 'country_iso3', 'iso3', 'country_alpha3')
        # year of birth may be stored in extra under several keys
        athlete_year_birth_val = pick('athlete_year_birth', 'athlete_birth_year', 'birth_year', 'year_of_birth')

        if discipline_val:
            res_updates['discipline_title'] = discipline_val
        if slug_game_val:
            res_updates['slug_game'] = slug_game_val
        if event_title_val:
            res_updates['event_title'] = event_title_val
        if event_gender_val:
            res_updates['event_gender'] = event_gender_val
        if medal_type_val:
            # prefer existing medal_type column only if it's not empty
            res_updates['medal_type'] = medal_type_val
        if participant_type_val:
            res_updates['participant_type'] = participant_type_val
        if participant_title_val:
            res_updates['participant_title'] = participant_title_val
        if athlete_url_val:
            res_updates['athlete_url'] = athlete_url_val
        if athlete_full_name_val:
            res_updates['athlete_full_name'] = athlete_full_name_val
        if country_name_val:
            res_updates['country_name'] = country_name_val
        if country_code_val:
            res_updates['country_code'] = country_code_val
        if country_3_val:
            res_updates['country_3_letter_code'] = country_3_val

        if res_updates:
            set_clauses = []
            params = []
            # Use CASE to also overwrite empty-string values
            for k, v in res_updates.items():
                set_clauses.append(f"{k} = CASE WHEN {k} IS NULL OR trim({k}) = '' THEN %s ELSE {k} END")
                params.append(v)
            params.append(r['id'])
            sql = f"UPDATE results SET {', '.join(set_clauses)} WHERE id = %s"
            cur.execute(sql, params)
            if cur.rowcount:
                updated_results += cur.rowcount

        # If we have a numeric athlete_year_birth and a linked athlete_id, update athletes.age
        if athlete_year_birth_val is not None and r.get('athlete_id'):
            # try to coerce to int safely
            try:
                birth_year = int(str(athlete_year_birth_val).strip())
            except Exception:
                birth_year = None

            # sanity check for plausible year
            if birth_year and 1800 <= birth_year <= 2100:
                # update only when age is NULL or empty (conservative) — set to birth year
                cur.execute(
                    "UPDATE athletes SET age = CASE WHEN age IS NULL OR age = 0 THEN %s ELSE age END WHERE id = %s",
                    (birth_year, r['athlete_id'])
                )
                if cur.rowcount:
                    updated_athletes += cur.rowcount

    conn.commit()
    print(f'Updated athletes: approx {updated_athletes}, Updated results: approx {updated_results}')


def main():
    conn = get_conn()
    ensure_columns(conn)
    migrate_from_results_extra(conn)
    conn.close()


if __name__ == '__main__':
    main()
