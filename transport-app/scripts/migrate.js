/**
 * Naïve forward-only SQL migration runner.
 * Runs every *.sql file in `migrations/` in lexical order against the DATABASE_URL.
 *
 * Usage:
 *   npm run migrate
 *
 * For multi-developer projects, swap this for `node-pg-migrate`, `umzug`,
 * or `dbmate` — but this script is enough to bootstrap a single-server install.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function main() {
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      ran_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows: already } = await pool.query(`SELECT filename FROM _migrations`);
  const done = new Set(already.map(r => r.filename));

  for (const f of files) {
    if (done.has(f)) {
      console.log(`= skip   ${f}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log(`▶ apply  ${f}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(`INSERT INTO _migrations (filename) VALUES ($1)`, [f]);
      await client.query('COMMIT');
      console.log(`✔ ok     ${f}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✖ failed ${f}`, err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log('All migrations complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });
