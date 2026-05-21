/**
 * Auth routes: register and login.
 *
 * POST /api/auth/register   { email, password, name, role? }   → 201 { user }
 * POST /api/auth/login      { email, password }                 → 200 { token, user }
 *
 * In production, restrict /register to admins (or disable it and create users via a CLI).
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const router = express.Router();

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const ALLOWED_ROLES = new Set(['admin', 'dispatcher', 'driver']);

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role = 'dispatcher' } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ error: `role must be one of: ${[...ALLOWED_ROLES].join(', ')}` });
    }

    const hash = await bcrypt.hash(password, ROUNDS);
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email.toLowerCase(), hash, name, role]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {  // unique_violation on email
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await query(
      `SELECT id, email, name, role, password_hash FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
