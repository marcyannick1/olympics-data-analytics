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

// GET /api/medal_countries?game_slug=&medal_type=&limit=&offset=
app.get(`${API_PREFIX}/medal_countries`, async (req, res) => {
  try {
    const { game_slug, medal_type, limit = 100, offset = 0 } = req.query;
    const params = [];
    const where = [];

    if (game_slug) { params.push(game_slug); where.push(`m.game_slug = $${params.length}`); }
    if (medal_type) { params.push(medal_type); where.push(`m.medal_type ILIKE $${params.length}`); }

    let sql = `
      WITH base AS (
        SELECT
          ${COUNTRY_NORM_SQL} AS country_norm,
          a.noc,
          COALESCE(a.noc, ${COUNTRY_NORM_SQL}) AS group_key,
          m.id AS medal_id,
          m.game_slug,
          m.medal_type
        FROM athletes a
        JOIN medals m ON m.athlete_id = a.id
        WHERE (a.team IS NOT NULL OR a.noc IS NOT NULL)
        ${where.length ? ' AND ' + where.join(' AND ') : ''}
      )
      SELECT
        MIN(country_norm) AS country_name,
        NULLIF(MAX(noc), '') AS noc,
        SUM(CASE WHEN medal_type ILIKE 'Gold' THEN 1 ELSE 0 END)::int AS gold_count,
        SUM(CASE WHEN medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
        SUM(CASE WHEN medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
        COUNT(*)::int AS medal_count,
        COALESCE(
          JSON_AGG(JSON_BUILD_OBJECT('id', medal_id, 'game_slug', game_slug, 'medal_type', medal_type) ORDER BY medal_id)
          FILTER (WHERE medal_id IS NOT NULL),
          '[]'
        ) AS medals
      FROM base
      GROUP BY group_key
      ORDER BY medal_count DESC, country_name
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'internal_error' }); }
});

// GET /api/medal_countries/ranking?game_slug=&limit=&offset=
// Returns countries ranked by total medals and counts per medal type (gold/silver/bronze)
app.get(`${API_PREFIX}/medal_countries/ranking`, async (req, res) => {
  try {
    const { game_slug, medal_type, limit = 100, offset = 0 } = req.query;
    const params = [];
    const where = [];
    if (game_slug) { params.push(game_slug); where.push(`m.game_slug = $${params.length}`); }
    if (medal_type) { params.push(medal_type); where.push(`m.medal_type ILIKE $${params.length}`); }

    let sql = `
      WITH base AS (
        SELECT
          ${COUNTRY_NORM_SQL} AS country_norm,
          a.noc,
          COALESCE(a.noc, ${COUNTRY_NORM_SQL}) AS group_key,
          m.medal_type
        FROM athletes a
        JOIN medals m ON m.athlete_id = a.id
        WHERE (a.team IS NOT NULL OR a.noc IS NOT NULL)
        ${where.length ? ' AND ' + where.join(' AND ') : ''}
      )
      SELECT
        MIN(country_norm) AS country_name,
        NULLIF(MAX(noc), '') AS noc,
        SUM(CASE WHEN medal_type ILIKE 'Gold' THEN 1 ELSE 0 END)::int AS gold_count,
        SUM(CASE WHEN medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
        SUM(CASE WHEN medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
        COUNT(*)::int AS medal_count
      FROM base
      GROUP BY group_key
      ORDER BY medal_count DESC, country_name
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'internal_error' }); }
});

// GET /api/medal_countries/totals?game_slug=
// Returns per-country medal totals (gold/silver/bronze/total) and a global summary
app.get(`${API_PREFIX}/medal_countries/totals`, async (req, res) => {
  try {
    const { game_slug, medal_type, limit = 100, offset = 0 } = req.query;

    // --- Per-country aggregation with normalization & group_key
    const perParams = [];
    const perWhere = [];
    if (game_slug) { perParams.push(game_slug); perWhere.push(`m.game_slug = $${perParams.length}`); }
    if (medal_type) { perParams.push(medal_type); perWhere.push(`m.medal_type ILIKE $${perParams.length}`); }

    let perSql = `
      WITH base AS (
        SELECT
          ${COUNTRY_NORM_SQL} AS country_norm,
          a.noc,
          COALESCE(a.noc, ${COUNTRY_NORM_SQL}) AS group_key,
          m.medal_type
        FROM athletes a
        JOIN medals m ON m.athlete_id = a.id
        WHERE (a.team IS NOT NULL OR a.noc IS NOT NULL)
        ${perWhere.length ? ' AND ' + perWhere.join(' AND ') : ''}
      )
      SELECT
        MIN(country_norm) AS country_name,
        NULLIF(MAX(noc), '') AS noc,
        SUM(CASE WHEN medal_type ILIKE 'Gold' THEN 1 ELSE 0 END)::int AS gold_count,
        SUM(CASE WHEN medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
        SUM(CASE WHEN medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
        COUNT(*)::int AS medal_count
      FROM base
      GROUP BY group_key
      ORDER BY medal_count DESC, country_name
      LIMIT $${perParams.length + 1} OFFSET $${perParams.length + 2}
    `;
    perParams.push(limit, offset);

    // --- Global aggregation (identique, pas besoin de normaliser ici)
    const globalWhereParts = ['(a.team IS NOT NULL OR a.noc IS NOT NULL)'];
    const globalParams = [];
    if (game_slug) { globalParams.push(game_slug); globalWhereParts.push(`m.game_slug = $${globalParams.length}`); }
    if (medal_type) { globalParams.push(medal_type); globalWhereParts.push(`m.medal_type ILIKE $${globalParams.length}`); }

    let globalSql = `
      SELECT
        SUM(CASE WHEN m.medal_type ILIKE 'Gold' THEN 1 ELSE 0 END)::int AS gold_count,
        SUM(CASE WHEN m.medal_type ILIKE 'Silver' THEN 1 ELSE 0 END)::int AS silver_count,
        SUM(CASE WHEN m.medal_type ILIKE 'Bronze' THEN 1 ELSE 0 END)::int AS bronze_count,
        COUNT(m.id)::int AS total_medals
      FROM medals m
      JOIN athletes a ON m.athlete_id = a.id
      WHERE ${globalWhereParts.join(' AND ')}
    `;

    const perRes = await db.query(perSql, perParams);
    const globalRes = await db.query(globalSql, globalParams);

    res.json({
      countries: perRes.rows,
      global: globalRes.rows[0] || { gold_count: 0, silver_count: 0, bronze_count: 0, total_medals: 0 }
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'internal_error' }); }
});

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API server listening on http://localhost:${port}${API_PREFIX}`));
