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

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API server listening on http://localhost:${port}${API_PREFIX}`));
