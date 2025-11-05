const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const API_PREFIX = '/api';

// GET /api/hosts?year=2022&season=Winter
app.get(`${API_PREFIX}/hosts`, async (req, res) => {
  try {
    const { year, season } = req.query;
    let sql = 'SELECT * FROM hosts';
    const params = [];
    const where = [];
    if (year) { params.push(year); where.push(`game_year = $${params.length}`); }
    if (season) { params.push(season); where.push(`game_season ILIKE $${params.length}`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY game_year DESC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/hosts/:slug
app.get(`${API_PREFIX}/hosts/:slug`, async (req, res) => {
  try {
    const { slug } = req.params;
    const { rows } = await db.query('SELECT * FROM hosts WHERE game_slug = $1 LIMIT 1', [slug]);
    if (!rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'internal_error' }); }
});

// GET /api/athletes?name=...&team=...&noc=...&limit=50
app.get(`${API_PREFIX}/athletes`, async (req, res) => {
  try {
    const { name, team, noc, limit = 100, offset = 0 } = req.query;
    const params = [];
    let sql = 'SELECT id, ref_id, name, sex, age, height, weight, team, noc FROM athletes';
    const where = [];
    if (name) { params.push(`%${name}%`); where.push(`name ILIKE $${params.length}`); }
    if (team) { params.push(team); where.push(`team ILIKE $${params.length}`); }
    if (noc) { params.push(noc); where.push(`noc = $${params.length}`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    params.push(limit); params.push(offset);
    sql += ` ORDER BY name LIMIT $${params.length-1} OFFSET $${params.length}`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'internal_error' }); }
});

// GET /api/athletes/:id -> athlete + results
app.get(`${API_PREFIX}/athletes/:id`, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows: athletes } = await db.query('SELECT id, ref_id, name, sex, age, height, weight, team, noc FROM athletes WHERE id = $1', [id]);
    if (!athletes.length) return res.status(404).json({ error: 'not_found' });
    const athlete = athletes[0];
    const { rows: results } = await db.query('SELECT * FROM results WHERE athlete_id = $1 ORDER BY year DESC NULLS LAST', [id]);
    athlete.results = results;
    res.json(athlete);
  } catch (err) { console.error(err); res.status(500).json({ error: 'internal_error' }); }
});

// GET /api/results?game_slug=&sport=&medal=&limit=
app.get(`${API_PREFIX}/results`, async (req, res) => {
  try {
    const { game_slug, sport, medal, limit = 200, offset = 0 } = req.query;
    const params = [];
    let sql = 'SELECT r.*, a.name AS athlete_name, a.team AS athlete_team FROM results r LEFT JOIN athletes a ON r.athlete_id = a.id';
    const where = [];
    if (game_slug) { params.push(game_slug); where.push(`r.game_slug = $${params.length}`); }
    if (sport) { params.push(sport); where.push(`r.sport ILIKE $${params.length}`); }
    if (medal) { params.push(medal); where.push(`r.medal ILIKE $${params.length}`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    params.push(limit); params.push(offset);
    sql += ` ORDER BY r.year DESC NULLS LAST LIMIT $${params.length-1} OFFSET $${params.length}`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'internal_error' }); }
});

// GET /api/medals?game_slug=&medal_type=
app.get(`${API_PREFIX}/medals`, async (req, res) => {
  try {
    const { game_slug, medal_type, limit = 200, offset = 0 } = req.query;
    const params = [];
    let sql = 'SELECT m.*, a.name as athlete_name FROM medals m LEFT JOIN athletes a ON m.athlete_id = a.id';
    const where = [];
    if (game_slug) { params.push(game_slug); where.push(`m.game_slug = $${params.length}`); }
    if (medal_type) { params.push(medal_type); where.push(`m.medal_type ILIKE $${params.length}`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    params.push(limit); params.push(offset);
    sql += ` ORDER BY m.id LIMIT $${params.length-1} OFFSET $${params.length}`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'internal_error' }); }
});
/**
 * GET /api/medals/:country
 * ➜ Détails des médailles pour un pays donné (nom ou code NOC)
 */
app.get(`${API_PREFIX}/medals/:country`, async (req, res) => {
  try {
    const { country } = req.params;
    const sql = `
      SELECT
        r.id AS result_id,
        a.id AS athlete_id,
        a.name AS athlete_name,
        a.noc,
        r.country_name,
        r.game_slug,
        r.sport,
        r.event,
        r.medal,
        r.medal_type,
        h.game_name,
        h.game_year,
        h.game_season,
        h.game_location
      FROM results r
      JOIN athletes a ON r.athlete_id = a.id
      LEFT JOIN hosts h ON h.game_slug = r.game_slug
      WHERE LOWER(r.country_name) = LOWER($1)
         OR LOWER(a.noc) = LOWER($1)
         OR LOWER(a.team) LIKE LOWER($1 || '%')
      ORDER BY h.game_year DESC NULLS LAST;
    `;
    const { rows } = await db.query(sql, [country]);
    if (!rows.length) return res.status(404).json({ error: 'not_found' });
    res.json({
      country: country,
      total_results: rows.length,
      results: rows,
    });
  } catch (err) {
    console.error('Error in /api/medals/:country', err);
    res.status(500).json({ error: 'internal_error' });
  }
});


/**
 * GET /api/stats/gdp-vs-medals
 * ➜ Corrélation PIB / médailles avec harmonisation des noms de pays
 */
app.get(`${API_PREFIX}/stats/gdp-vs-medals`, async (req, res) => {
  try {
    const sql = `
      WITH medal_data AS (
        SELECT
          LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(
            COALESCE(r.country_name, a.team, a.name),
            'The ', ''), 'Republic of ', ''), 'People''s ', ''), 'Democratic ', ''))) AS raw_name,
          COALESCE(a.noc, r.country_name) AS raw_noc,
          SUM(CASE WHEN m.medal_type ILIKE 'Gold'   THEN 1 ELSE 0 END)::int AS gold_count,
          SUM(CASE WHEN m.medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
          SUM(CASE WHEN m.medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
          COUNT(m.id)::int AS total_medals
        FROM medals m
        JOIN results r ON m.result_id = r.id
        JOIN athletes a ON a.id = m.athlete_id
        WHERE r.country_name IS NOT NULL
          AND r.country_name !~* '(boat|club|university|crew|association|academy|relay|mixed|team|school)'
          AND r.country_name !~* '^[A-Z][a-z]+ [A-Z][a-z]+$'
        GROUP BY LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(
            COALESCE(r.country_name, a.team, a.name),
            'The ', ''), 'Republic of ', ''), 'People''s ', ''), 'Democratic ', ''))),
          COALESCE(a.noc, r.country_name)
      ),
      harmonized AS (
        SELECT
          md.raw_name,
          md.raw_noc,
          md.gold_count,
          md.silver_count,
          md.bronze_count,
          md.total_medals,
          cl.country_name AS official_name,
          cl.noc AS official_noc,
          cl.latitude,
          cl.longitude
        FROM medal_data md
        LEFT JOIN country_locations cl
          ON LOWER(cl.country_name) = md.raw_name
             OR LOWER(cl.noc) = LOWER(md.raw_noc)
             OR LOWER(cl.country_name) IN (
               -- équivalents textuels pour harmoniser les synonymes
               'united states of america', 'united states',
               'china', 'peoples republic of china',
               'russia', 'russian federation',
               'germany', 'federal republic of germany', 'german democratic republic',
               'south korea', 'republic of korea',
               'north korea', 'democratic people''s republic of korea',
               'uk', 'united kingdom', 'great britain'
             )
      ),
      unified AS (
        SELECT
          COALESCE(official_name, INITCAP(raw_name)) AS country_name,
          COALESCE(official_noc, raw_noc) AS noc,
          SUM(gold_count)::int AS gold_count,
          SUM(silver_count)::int AS silver_count,
          SUM(bronze_count)::int AS bronze_count,
          SUM(total_medals)::int AS total_medals,
          MAX(latitude) AS latitude,
          MAX(longitude) AS longitude
        FROM harmonized
        GROUP BY COALESCE(official_name, INITCAP(raw_name)), COALESCE(official_noc, raw_noc)
      )
      SELECT
        u.country_name,
        u.noc,
        g.gdp,
        u.gold_count,
        u.silver_count,
        u.bronze_count,
        u.total_medals
      FROM unified u
      LEFT JOIN country_gdp g
        ON LOWER(g.country_name) = LOWER(u.country_name)
           OR LOWER(g.country_code) = LOWER(u.noc)
      WHERE u.total_medals > 0
      ORDER BY u.total_medals DESC, u.gold_count DESC
      LIMIT 100;
    `;

    const { rows } = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/stats/gdp-vs-medals', err);
    res.status(500).json({ error: 'internal_error' });
  }
});


/**
 * GET /api/countries/locations
 * ➜ Coordonnées + médailles agrégées par pays
 */
app.get(`${API_PREFIX}/countries/locations`, async (req, res) => {
  try {
    const sql = `
      WITH base AS (
        SELECT
          COALESCE(r.country_name, a.team, a.name) AS country_name,
          COALESCE(a.noc, r.country_name) AS country_noc,
          SUM(CASE WHEN m.medal_type ILIKE 'Gold'   THEN 1 ELSE 0 END)::int AS gold_count,
          SUM(CASE WHEN m.medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
          SUM(CASE WHEN m.medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
          COUNT(m.id)::int AS total_medals
        FROM medals m
        JOIN results r ON r.id = m.result_id
        JOIN athletes a ON a.id = m.athlete_id
        WHERE r.country_name IS NOT NULL
          AND r.country_name !~* '(boat|club|university|association|academy|relay|team)'
          AND r.country_name !~* '^[A-Z][a-z]+ [A-Z][a-z]+$'
        GROUP BY COALESCE(r.country_name, a.team, a.name), COALESCE(a.noc, r.country_name)
      )
      SELECT
        cl.country_name,
        cl.noc,
        cl.latitude,
        cl.longitude,
        b.gold_count,
        b.silver_count,
        b.bronze_count,
        b.total_medals
      FROM country_locations cl
      LEFT JOIN base b
        ON LOWER(cl.country_name) = LOWER(b.country_name)
           OR LOWER(cl.noc) = LOWER(b.country_noc)
      WHERE cl.latitude IS NOT NULL AND cl.longitude IS NOT NULL
      ORDER BY b.total_medals DESC NULLS LAST;
    `;
    const { rows } = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/countries/locations', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/history/medals?noc=FR
app.get(`${API_PREFIX}/history/medals`, async (req, res) => {
  try {
    const { noc } = req.query;
    const params = [];
    let sql = `
      SELECT
        h.game_year,
        h.game_slug,
        h.game_season,
        h.game_location,
        COALESCE(SUM(CASE WHEN m.medal_type ILIKE 'Gold'   THEN 1 ELSE 0 END), 0)::int AS gold_count,
        COALESCE(SUM(CASE WHEN m.medal_type ILIKE 'Silver' THEN 1 ELSE 0 END), 0)::int AS silver_count,
        COALESCE(SUM(CASE WHEN m.medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END), 0)::int AS bronze_count,
        COUNT(m.id)::int AS total_medals
      FROM hosts h
      LEFT JOIN medals m ON m.game_slug = h.game_slug
      LEFT JOIN athletes a ON a.id = m.athlete_id
    `;
    if (noc) {
      params.push(noc);
      sql += ` WHERE a.noc = $${params.length}`;
    }
    sql += `
      GROUP BY h.game_year, h.game_slug, h.game_season, h.game_location
      ORDER BY h.game_year;
    `;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/history/medals', err);
    res.status(500).json({ error: 'internal_error' });
  }
});


// GET /api/medalists?game_slug=&medal_type=&limit=&offset=
app.get(`${API_PREFIX}/medalists`, async (req, res) => {
  try {
    const { game_slug, medal_type, only_individuals, only_teams, limit = 100, offset = 0 } = req.query;
    const params = [];
    // return medal_count as integer and include detailed medals array
    let sql = `SELECT a.id, a.ref_id, a.name, a.sex, a.age, a.height, a.weight, a.team, a.noc,
                      COUNT(m.id)::int AS medal_count,
                      COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', m.id, 'game_slug', m.game_slug, 'medal_type', m.medal_type) ORDER BY m.id) FILTER (WHERE m.id IS NOT NULL), '[]') AS medals
               FROM athletes a
               JOIN medals m ON m.athlete_id = a.id`;
    const where = [];
    if (game_slug) { params.push(game_slug); where.push(`m.game_slug = $${params.length}`); }
    if (medal_type) { params.push(medal_type); where.push(`m.medal_type ILIKE $${params.length}`); }
    if (only_individuals === 'true') { where.push(`a.team IS NULL`); }
    if (only_teams === 'true') { where.push(`a.team IS NOT NULL`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY a.id ORDER BY medal_count DESC, a.name';
    params.push(limit); params.push(offset);
    sql += ` LIMIT $${params.length-1} OFFSET $${params.length}`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'internal_error' }); }
});

/**
 * Helpers de normalisation pays
 * On retire ' team', ' team #x' et/ou ' #x' en fin de chaîne, insensible à la casse.
 * Puis TRIM pour nettoyer les espaces.
 * On groupe par 'group_key' = (NOC si présent, sinon nom normalisé).
 * NOTE: on garde NOC nul si absent (cas particuliers historiques).
 */
const COUNTRY_NORM_SQL = `
TRIM(
  REGEXP_REPLACE(
    COALESCE(a.team, a.name),
    '(?i)\\s*(team(\\s*#\\d+)?)\\s*$|\\s*#\\d+\\s*$',
    ''
  )
)
`;

// 💡 SQL de normalisation pays
const COUNTRY_CLEAN_SQL = `
LOWER(
  TRIM(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
      COALESCE(a.team, a.name, ''),
      'The ', ''
    ), 'Republic of ', ''), 'People''s ', ''), 'Democratic ', ''), '  ', ' ')
  )
)
`;

// Utilitaire de normalisation
const COUNTRY_EQUIV_SQL = `
  CASE
    WHEN LOWER(TRIM(COALESCE(a.team, a.name))) IN ('usa','us','united states','united states of america') THEN 'United States'
    WHEN LOWER(TRIM(COALESCE(a.team, a.name))) IN ('china','peoples republic of china') THEN 'China'
    WHEN LOWER(TRIM(COALESCE(a.team, a.name))) IN ('russia','russian federation','ussr') THEN 'Russia'
    WHEN LOWER(TRIM(COALESCE(a.team, a.name))) IN ('germany','federal republic of germany','german democratic republic') THEN 'Germany'
    WHEN LOWER(TRIM(COALESCE(a.team, a.name))) IN ('republic of korea','south korea') THEN 'South Korea'
    WHEN LOWER(TRIM(COALESCE(a.team, a.name))) IN ('democratic people''s republic of korea','north korea') THEN 'North Korea'
    WHEN LOWER(TRIM(COALESCE(a.team, a.name))) IN ('uk','united kingdom','great britain') THEN 'United Kingdom'
    ELSE INITCAP(TRIM(COALESCE(a.team, a.name)))
  END
`;

// ========================================
//  /api/stats/gdp-vs-medals
// ========================================
app.get(`${API_PREFIX}/stats/gdp-vs-medals`, async (req, res) => {
  try {
    const sql = `
      WITH base AS (
        SELECT
          ${COUNTRY_EQUIV_SQL} AS country_name,
          a.noc,
          m.medal_type
        FROM medals m
        JOIN athletes a ON a.id = m.athlete_id
        WHERE a.noc IS NOT NULL OR a.team IS NOT NULL
      ),
      grouped AS (
        SELECT
          COALESCE(cl.country_name, b.country_name) AS country_name,
          COALESCE(cl.noc, b.noc) AS noc,
          SUM(CASE WHEN b.medal_type ILIKE 'Gold' THEN 1 ELSE 0 END)::int AS gold_count,
          SUM(CASE WHEN b.medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
          SUM(CASE WHEN b.medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
          COUNT(*)::int AS total_medals
        FROM base b
        LEFT JOIN country_locations cl
          ON LOWER(cl.country_name) = LOWER(b.country_name)
             OR LOWER(cl.noc) = LOWER(b.noc)
        GROUP BY COALESCE(cl.country_name, b.country_name), COALESCE(cl.noc, b.noc)
      )
      SELECT
        g.country_name,
        g.noc,
        cg.gdp,
        g.gold_count,
        g.silver_count,
        g.bronze_count,
        g.total_medals
      FROM grouped g
      LEFT JOIN country_gdp cg
        ON LOWER(cg.country_name) = LOWER(g.country_name)
           OR LOWER(cg.country_code) = LOWER(g.noc)
      WHERE g.total_medals > 0
      ORDER BY g.total_medals DESC, g.gold_count DESC
      LIMIT 100;
    `;
    const { rows } = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/stats/gdp-vs-medals', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ========================================
//  /api/medal_countries/ranking
// ========================================
app.get(`${API_PREFIX}/medal_countries/ranking`, async (req, res) => {
  try {
    const { game_slug, medal_type, limit = 100, offset = 0 } = req.query;
    const params = [];
    const where = [];

    if (game_slug) { params.push(game_slug); where.push(`m.game_slug = $${params.length}`); }
    if (medal_type) { params.push(medal_type); where.push(`m.medal_type ILIKE $${params.length}`); }

    const sql = `
      WITH base AS (
        SELECT
          ${COUNTRY_EQUIV_SQL} AS country_name,
          a.noc,
          m.medal_type
        FROM athletes a
        JOIN medals m ON m.athlete_id = a.id
        WHERE (a.team IS NOT NULL OR a.noc IS NOT NULL)
        ${where.length ? ' AND ' + where.join(' AND ') : ''}
      )
      SELECT
        COALESCE(MAX(cl.country_name), MIN(b.country_name)) AS country_name,
        COALESCE(MAX(cl.noc), MAX(b.noc)) AS noc,
        SUM(CASE WHEN b.medal_type ILIKE 'Gold' THEN 1 ELSE 0 END)::int AS gold_count,
        SUM(CASE WHEN b.medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
        SUM(CASE WHEN b.medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
        COUNT(*)::int AS medal_count
      FROM base b
      LEFT JOIN country_locations cl
        ON LOWER(cl.country_name) = LOWER(b.country_name)
           OR LOWER(cl.noc) = LOWER(b.noc)
      GROUP BY COALESCE(cl.country_name, b.country_name)
      ORDER BY medal_count DESC, gold_count DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    params.push(limit, offset);
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/medal_countries/ranking', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ========================================
//  /api/medal_countries/totals
// ========================================
app.get(`${API_PREFIX}/medal_countries/totals`, async (req, res) => {
  try {
    const sql = `
      WITH base AS (
        SELECT
          ${COUNTRY_EQUIV_SQL} AS country_name,
          a.noc,
          m.medal_type
        FROM athletes a
        JOIN medals m ON m.athlete_id = a.id
        WHERE (a.team IS NOT NULL OR a.noc IS NOT NULL)
      ),
      per_country AS (
        SELECT
          COALESCE(MAX(cl.country_name), MIN(b.country_name)) AS country_name,
          COALESCE(MAX(cl.noc), MAX(b.noc)) AS noc,
          SUM(CASE WHEN b.medal_type ILIKE 'Gold' THEN 1 ELSE 0 END)::int AS gold_count,
          SUM(CASE WHEN b.medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
          SUM(CASE WHEN b.medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
          COUNT(*)::int AS medal_count
        FROM base b
        LEFT JOIN country_locations cl
          ON LOWER(cl.country_name) = LOWER(b.country_name)
             OR LOWER(cl.noc) = LOWER(b.noc)
        GROUP BY COALESCE(cl.country_name, b.country_name)
      )
      SELECT
        json_agg(per_country ORDER BY medal_count DESC) AS countries,
        json_build_object(
          'gold_count', SUM(per_country.gold_count),
          'silver_count', SUM(per_country.silver_count),
          'bronze_count', SUM(per_country.bronze_count),
          'total_medals', SUM(per_country.medal_count)
        ) AS global
      FROM per_country;
    `;
    const { rows } = await db.query(sql);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error in /api/medal_countries/totals', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ========================================
//  /api/medal_countries/top
// ========================================
app.get(`${API_PREFIX}/medal_countries/top`, async (req, res) => {
  try {
    const { game_slug, medal_type } = req.query;
    let { limit = 10, order = 'total' } = req.query;

    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    order = order.toLowerCase() === 'gold' ? 'gold' : 'total';

    const params = [];
    const where = [];
    if (game_slug) { params.push(game_slug); where.push(`m.game_slug = $${params.length}`); }
    if (medal_type) { params.push(medal_type); where.push(`m.medal_type ILIKE $${params.length}`); }

    const orderClause =
      order === 'gold'
        ? `ORDER BY gold_count DESC, silver_count DESC, bronze_count DESC`
        : `ORDER BY medal_count DESC, gold_count DESC, silver_count DESC`;

    const sql = `
      WITH base AS (
        SELECT
          ${COUNTRY_EQUIV_SQL} AS country_name,
          a.noc,
          m.medal_type
        FROM athletes a
        JOIN medals m ON m.athlete_id = a.id
        WHERE (a.team IS NOT NULL OR a.noc IS NOT NULL)
        ${where.length ? ' AND ' + where.join(' AND ') : ''}
      )
      SELECT
        COALESCE(MAX(cl.country_name), MIN(b.country_name)) AS country_name,
        COALESCE(MAX(cl.noc), MAX(b.noc)) AS noc,
        SUM(CASE WHEN b.medal_type ILIKE 'Gold' THEN 1 ELSE 0 END)::int AS gold_count,
        SUM(CASE WHEN b.medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
        SUM(CASE WHEN b.medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
        COUNT(*)::int AS medal_count
      FROM base b
      LEFT JOIN country_locations cl
        ON LOWER(cl.country_name) = LOWER(b.country_name)
           OR LOWER(cl.noc) = LOWER(b.noc)
      GROUP BY COALESCE(cl.country_name, b.country_name)
      ${orderClause}
      LIMIT $${params.length + 1};
    `;
    params.push(limit);
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/medal_countries/top', err);
    res.status(500).json({ error: 'internal_error' });
  }
});


// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API server listening on http://localhost:${port}${API_PREFIX}`));
