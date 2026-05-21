/**
 * Driver CRUD.
 */

const express = require('express');
const { query } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, full_name, license_number, phone, email, status, hired_at, notes, created_at, updated_at
       FROM drivers ORDER BY created_at DESC`
    );
    res.json({ drivers: rows });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM drivers WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ driver: rows[0] });
  } catch (e) { next(e); }
});

router.post('/', requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const { full_name, license_number, phone, email, status = 'active', hired_at, notes } = req.body || {};
    if (!full_name || !license_number) {
      return res.status(400).json({ error: 'full_name and license_number are required' });
    }
    const { rows } = await query(
      `INSERT INTO drivers (full_name, license_number, phone, email, status, hired_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [full_name, license_number, phone || null, email || null, status, hired_at || null, notes || null]
    );
    res.status(201).json({ driver: rows[0] });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'License number already exists' });
    next(e);
  }
});

router.patch('/:id', requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const fields = ['full_name', 'license_number', 'phone', 'email', 'status', 'hired_at', 'notes'];
    const sets = [];
    const values = [];
    let i = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        sets.push(`${f} = $${i++}`);
        values.push(req.body[f]);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    sets.push(`updated_at = now()`);
    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE drivers SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ driver: rows[0] });
  } catch (e) { next(e); }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM drivers WHERE id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
