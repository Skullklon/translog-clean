/**
 * Optional seed script: create an initial admin user.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@nexorard.org ADMIN_PASSWORD=ChangeMeNow! npm run seed
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrator';

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('Admin password must be at least 12 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
  await pool.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name`,
    [email.toLowerCase(), hash, name]
  );
  console.log(`✔ Admin user upserted: ${email}`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
