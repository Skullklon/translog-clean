/**
 * Shipment lifecycle.
 *
 * Statuses: pending → assigned → in_transit → delivered (or cancelled at any point)
 */

const express = require('express');
const { query } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'];

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE s.status = $1`;
    }
    const { rows } = await query(
      `SELECT s.*, v.plate AS vehicle_plate, d.full_name AS driver_name
       FROM shipments s
       LEFT JOIN vehicles v ON v.id = s.vehicle_id
       LEFT JOIN drivers  d ON d.id = s.driver_id
       ${where}
       ORDER BY s.created_at DESC`,
      params
    );
    res.json({ shipments: rows });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.*, v.plate AS vehicle_plate, d.full_name AS driver_name
       FROM shipments s
       LEFT JOIN vehicles v ON v.id = s.vehicle_id
       LEFT JOIN drivers  d ON d.id = s.driver_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ shipment: rows[0] });
  } catch (e) { next(e); }
});

router.post('/', requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const {
      reference, origin, destination,
      pickup_at, deliver_by,
      vehicle_id, driver_id,
      weight_kg, value_amount, currency, notes
    } = req.body || {};

    if (!reference || !origin || !destination) {
      return res.status(400).json({ error: 'reference, origin and destination are required' });
    }
    const status = vehicle_id && driver_id ? 'assigned' : 'pending';

    const { rows } = await query(
      `INSERT INTO shipments
       (reference, origin, destination, pickup_at, deliver_by,
        vehicle_id, driver_id, status, weight_kg, value_amount, currency, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [reference, origin, destination,
       pickup_at || null, deliver_by || null,
       vehicle_id || null, driver_id || null, status,
       weight_kg || null, value_amount || null, currency || 'USD', notes || null]
    );
    res.status(201).json({ shipment: rows[0] });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Shipment reference already exists' });
    next(e);
  }
});

router.patch('/:id', requireRole('admin', 'dispatcher', 'driver'), async (req, res, next) => {
  try {
    const fields = ['origin','destination','pickup_at','deliver_by',
                    'vehicle_id','driver_id','weight_kg','value_amount','currency','notes'];
    // Drivers can only update status; admins/dispatchers can update everything.
    const sets = [];
    const values = [];
    let i = 1;

    if (req.user.role !== 'driver') {
      for (const f of fields) {
        if (req.body[f] !== undefined) {
          sets.push(`${f} = $${i++}`);
          values.push(req.body[f]);
        }
      }
    }

    if (req.body.status !== undefined) {
      if (!VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      sets.push(`status = $${i++}`);
      values.push(req.body.status);
    }

    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    sets.push(`updated_at = now()`);
    values.push(req.params.id);

    const { rows } = await query(
      `UPDATE shipments SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ shipment: rows[0] });
  } catch (e) { next(e); }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM shipments WHERE id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
