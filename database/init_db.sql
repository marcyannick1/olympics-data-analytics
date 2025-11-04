-- init_db.sql
-- Crée le schéma relationnel : hosts, athletes, results, medals
-- NOTE: Creation of roles/users may require superuser privileges on the server.

BEGIN;

-- Hosts (hôtes des jeux)
CREATE TABLE IF NOT EXISTS hosts (
    game_slug TEXT PRIMARY KEY,
    game_name TEXT,
    game_location TEXT,
    game_season TEXT,
    game_year INTEGER,
    game_start_date TIMESTAMP,
    game_end_date TIMESTAMP
);

-- Athletes: we keep `ref_id` for the original dataset id when present
CREATE TABLE IF NOT EXISTS athletes (
    id SERIAL PRIMARY KEY,
    ref_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    sex TEXT,
    age INTEGER,
    height REAL,
    weight REAL,
    team TEXT,
    noc TEXT
);

-- Deduplicate any existing athletes that would violate the unique constraint
-- We group by lower(name) and lower(coalesce(team,'')) and keep the row with the smallest id
-- Then update references in `results` to point to the kept id and delete duplicates.
DO $$
BEGIN
    -- Only run dedupe if table has duplicates
    IF EXISTS (
        SELECT 1 FROM (
            SELECT lower(name) AS lname, lower(COALESCE(team, '')) AS lteam, count(*)
            FROM athletes
            GROUP BY lower(name), lower(COALESCE(team, ''))
            HAVING count(*) > 1
        ) t
    ) THEN
        -- Create a temporary table with duplicate rows and the id to keep
        CREATE TEMP TABLE tmp_duprows ON COMMIT DROP AS
        SELECT a.id AS id, d.keep_id
        FROM athletes a
        JOIN (
            SELECT lower(name) AS lname, lower(COALESCE(team, '')) AS lteam, min(id) AS keep_id
            FROM athletes
            GROUP BY lower(name), lower(COALESCE(team, ''))
            HAVING count(*) > 1
        ) d ON lower(a.name) = d.lname AND lower(COALESCE(a.team, '')) = d.lteam;

        -- update results to point to the kept athlete id
        UPDATE results r
        SET athlete_id = t.keep_id
        FROM tmp_duprows t
        WHERE r.athlete_id = t.id AND t.id <> t.keep_id;

        -- delete duplicate athlete rows (keep the keep_id)
        DELETE FROM athletes a
        USING tmp_duprows t
        WHERE a.id = t.id AND t.id <> t.keep_id;

        -- drop temp table explicitly (will be dropped on commit too)
        DROP TABLE IF EXISTS tmp_duprows;
    END IF;
END$$;

-- Create unique index to avoid future duplicates (case-insensitive name + team)
CREATE UNIQUE INDEX IF NOT EXISTS athletes_name_team_idx ON athletes (lower(name), lower(COALESCE(team, '')));

-- Results: performance per athlete per event in a game
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    game_slug TEXT  REFERENCES hosts(game_slug) ON DELETE CASCADE,
    year INTEGER,
    season TEXT,
    city TEXT,
    sport TEXT,
    event TEXT,
    medal TEXT,
    extra JSONB,
    UNIQUE (athlete_id, game_slug, sport, event)
);

-- Medals: materialized view of medal-winning results (one row per medal)
CREATE TABLE IF NOT EXISTS medals (
    id SERIAL PRIMARY KEY,
    result_id INTEGER NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    game_slug TEXT NOT NULL REFERENCES hosts(game_slug) ON DELETE CASCADE,
    medal_type TEXT NOT NULL CHECK (medal_type IN ('Gold','Silver','Bronze')),
    UNIQUE (result_id)
);

COMMIT;

-- Optional: role and privilege setup (may fail if user lacks rights)
-- Replace 'db_admin_user'/'db_readonly_user' and passwords before executing,
-- or create users via your hosting control panel.
--
-- CREATE ROLE db_admin_user WITH LOGIN PASSWORD 'replace_with_strong_password';
-- CREATE ROLE db_readonly_user WITH LOGIN PASSWORD 'replace_with_strong_password';
--
-- GRANT ALL PRIVILEGES ON TABLE hosts, athletes, results, medals TO db_admin_user;
-- GRANT SELECT ON TABLE hosts, athletes, results, medals TO db_readonly_user;
