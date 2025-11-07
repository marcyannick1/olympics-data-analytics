const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // optional: set ssl depending on hosting
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
