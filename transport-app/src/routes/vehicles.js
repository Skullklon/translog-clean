/**
 * Vehicle CRUD.
 *
 *   GET    /api/vehicles
 *   GET    /api/vehicles/:id
 *   POST   /api/vehicles              (admin, dispatcher)
 *   PATCH  /api/vehicles/:id          (admin, dispatcher)
 *   DELETE /api/vehicles/:id          (admin)
 */

const express = require('express');
const { query } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, plate, make, model, year, status, capacity_kg, notes, created_at, updated_at
       FROM vehicles ORDER BY created_at DESC`
    );
    res.json({ vehicles: rows });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM vehicles WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ vehicle: rows[0] });
  } catch (e) { next(e); }
});

router.post('/', requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const { plate, make, model, year, status = 'available', capacity_kg, notes } = req.body || {};
    if (!plate || !make || !model) {
      return res.status(400).json({ error: 'plate, make, and model are required' });
    }
    const { rows } = await query(
      `INSERT INTO vehicles (plate, make, model, year, status, capacity_kg, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [plate, make, model, year || null, status, capacity_kg || null, notes || null]
    );
    res.status(201).json({ vehicle: rows[0] });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Plate already exists' });
    next(e);
  }
});

router.patch('/:id', requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const fields = ['plate', 'make', 'model', 'year', 'status', 'capacity_kg', 'notes'];
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
      `UPDATE vehicles SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ vehicle: rows[0] });
  } catch (e) { next(e); }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM vehicles WHERE id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
