/**
 * PostgreSQL connection pool.
 *
 * Reads DATABASE_URL if provided, otherwise PGHOST/PGPORT/etc.
 * Uses TCP keep-alive and a sensible pool size for a single Node instance.
 */

const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      // ssl: { rejectUnauthorized: false }   // enable if your provider requires it
    })
  : new Pool({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });

pool.on('error', (err) => {
  console.error('[db] unexpected pool error', err);
});

/**
 * Thin wrapper around pool.query that always returns rows directly when convenient.
 */
async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

module.exports = { pool, query };
