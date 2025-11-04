#!/usr/bin/env python3
"""Extract medals from dataset/olympic_medals.xlsx and populate the `medals` table.

Usage:
    python extract_medals_xlsx.py

This script will:
- read the Excel file `dataset/olympic_medals.xlsx` (first sheet)
- for each row, ensure the athlete exists in `athletes` (creates if missing)
- insert or update a corresponding `results` row with sport/event/medal and store the original row in `extra`
- insert a `medals` row when appropriate (avoids duplicates)

Run this after a DB backup. The script is conservative and idempotent.
"""

import sys
from pathlib import Path
import pandas as pd

from db import get_conn, get_or_create_athlete, insert_result, insert_medal_if_any, ensure_host_exists


BASE = Path(__file__).resolve().parent.parent
XLSX = BASE / 'dataset' / 'olympic_medals.xlsx'


def read_sheet(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Excel file not found: {path}")
    # pandas will use openpyxl for .xlsx
    df = pd.read_excel(path, engine='openpyxl')
    return df


def normalize_str(v):
    if pd.isna(v):
        return None
    s = str(v).strip()
    return s if s != '' else None


def main():
    df = read_sheet(XLSX)
    print(f"Read {len(df)} rows from {XLSX.name}")

    conn = get_conn()
    inserted_medals = 0
    inserted_results = 0
    inserted_athletes = 0

    for idx, row in df.iterrows():
        # Map columns (expected names from the spreadsheet)
        discipline = normalize_str(row.get('discipline_title'))
        slug_game = normalize_str(row.get('slug_game'))
        event_title = normalize_str(row.get('event_title'))
        event_gender = normalize_str(row.get('event_gender'))
        medal_type = normalize_str(row.get('medal_type'))
        participant_type = normalize_str(row.get('participant_type'))
        participant_title = normalize_str(row.get('participant_title'))
        athlete_url = normalize_str(row.get('athlete_url'))
        athlete_full_name = normalize_str(row.get('athlete_full_name'))
        country_name = normalize_str(row.get('country_name'))
        country_code = normalize_str(row.get('country_code'))
        country_3 = normalize_str(row.get('country_3_letter_code'))

        # Skip rows with no athlete name and no participant title
        if not athlete_full_name and not participant_title:
            # nothing to insert as athlete
            continue

        # Build athlete dict. Do NOT store the URL in `ref_id` because
        # `athletes.ref_id` is an INTEGER in the schema. Keep URL in extra instead.
        athlete = {
            'name': athlete_full_name or participant_title,
            'team': participant_title,
            'noc': country_code or country_3,
            'ref_id': None,
        }

        # ensure host exists (guard against unexpected errors)
        if slug_game:
            try:
                ensure_host_exists(conn, slug_game)
            except Exception as e:
                print(f"Warning: ensure_host_exists failed for slug '{slug_game}': {e}")
                # continue — we can still insert results without a host row

        try:
            aid = get_or_create_athlete(conn, athlete)
        except Exception as e:
            print(f"Skipping row {idx}: failed to get/create athlete: {e}")
            continue

        # prepare result dict for insert_result
        result = {
            'athlete_id': aid,
            'game_slug': slug_game,
            'year': None,
            'season': None,
            'city': None,
            'sport': discipline,
            'event': event_title,
            'medal': medal_type,
            'extra': {
                'participant_type': participant_type,
                'participant_title': participant_title,
                'athlete_url': athlete_url,
                'athlete_full_name': athlete_full_name,
                'country_name': country_name,
                'country_code': country_code,
                'country_3_letter_code': country_3,
                'event_gender': event_gender,
            }
        }

        try:
            rid = insert_result(conn, result)
            inserted_results += 1
        except Exception as e:
            print(f"Failed to insert result for row {idx}: {e}")
            continue

        try:
            mid = insert_medal_if_any(conn, rid, aid, slug_game, medal_type)
            if mid:
                inserted_medals += 1
        except Exception as e:
            print(f"Failed to insert medal for row {idx}: {e}")
            continue

    conn.close()
    print(f"Inserted/updated results: {inserted_results}, inserted medals: {inserted_medals}")


if __name__ == '__main__':
    main()
