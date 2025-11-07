#!/usr/bin/env python3
"""
update_geo_gdp.py
-----------------
Combine la récupération des données géographiques (lat/long)
et économiques (PIB) pour chaque pays.

Usage :
    python update_geo_gdp.py

Ce script :
- crée les tables `country_locations` et `country_gdp` si absentes
- télécharge les coordonnées via REST Countries
- télécharge le PIB via World Bank
- insère ou met à jour les données dans ta base PostgreSQL
"""

import requests
import psycopg2
from db import get_conn


def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS country_locations (
            id SERIAL PRIMARY KEY,
            country_name TEXT NOT NULL,
            noc TEXT UNIQUE,
            latitude REAL,
            longitude REAL
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS country_gdp (
            id SERIAL PRIMARY KEY,
            country_name TEXT NOT NULL,
            country_code TEXT UNIQUE,
            gdp NUMERIC  -- en USD
        );
    """)
    conn.commit()
    print("✅ Tables verified or created.")


def fetch_country_locations(conn):
    print("🌍 Fetching country locations from REST Countries...")
    url = "https://raw.githubusercontent.com/mledoze/countries/master/countries.json"


    try:
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        print(f"❌ Error fetching REST Countries data: {e}")
        return

    cur = conn.cursor()
    inserted = 0
    for c in data:
        name = c.get("name", {}).get("common")
        noc = c.get("cca3")
        latlng = c.get("latlng", [None, None])
        lat, lng = latlng if len(latlng) == 2 else (None, None)
        if not name or not noc:
            continue
        cur.execute("""
            INSERT INTO country_locations (country_name, noc, latitude, longitude)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (noc) DO UPDATE
            SET country_name = EXCLUDED.country_name,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude;
        """, (name, noc, lat, lng))
        inserted += 1

    conn.commit()
    print(f"✅ Inserted/updated {inserted} country locations.")


def fetch_country_gdp(conn):
    print("💰 Fetching GDP data from World Bank...")
    url = "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2023&per_page=400"
    try:
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        data = res.json()
        if len(data) < 2:
            print("⚠️ Unexpected World Bank response format.")
            return
        entries = data[1]
    except Exception as e:
        print(f"❌ Error fetching World Bank data: {e}")
        return

    cur = conn.cursor()
    inserted = 0
    for entry in entries:
        country = entry.get("country", {}).get("value")
        code = entry.get("country", {}).get("id")
        gdp_value = entry.get("value")
        if not country or not gdp_value or gdp_value is None:
            continue
        cur.execute("""
            INSERT INTO country_gdp (country_name, country_code, gdp)
            VALUES (%s, %s, %s)
            ON CONFLICT (country_code) DO UPDATE
            SET gdp = EXCLUDED.gdp, country_name = EXCLUDED.country_name;
        """, (country, code, gdp_value))
        inserted += 1

    conn.commit()
    print(f"✅ Inserted/updated {inserted} GDP entries.")


def main():
    conn = get_conn()
    ensure_tables(conn)
    fetch_country_locations(conn)
    fetch_country_gdp(conn)
    conn.close()
    print("\n🏁 Geo + GDP data successfully updated!")


if __name__ == "__main__":
    main()
