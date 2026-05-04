import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

const VALID_TIERS = ['basic', 'standard', 'premium'];
const VALID_UNITS = ['hour', 'flat', 'month', 'day', 'week'];

function rowToService(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || null,
    tier: row.tier,
    price: parseFloat(row.price),
    unit: row.unit,
    createdAt: row.created_at ? row.created_at.toISOString?.() ?? row.created_at : null,
  };
}

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { rows } = await db.query('SELECT * FROM services ORDER BY tier, price ASC');
    return res.json({ success: true, data: rows.map(rowToService) });
  } catch (err) {
    console.error('[services] GET /', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch services' } });
  }
});

// POST /api/services
router.post('/', async (req, res) => {
  try {
    const { name, description, tier, price, unit } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
    }
    if (!tier || !VALID_TIERS.includes(tier)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `tier must be one of: ${VALID_TIERS.join(', ')}` } });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'price must be a non-negative number' } });
    }
    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'unit is required' } });
    }

    const id = uuidv4();
    const db = await getDb();
    await db.query(
      `INSERT INTO services (id, name, description, tier, price, unit) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, name.trim(), description?.trim() || null, tier, Number(price), unit.trim()]
    );

    const { rows } = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    return res.status(201).json({ success: true, data: rowToService(rows[0]) });
  } catch (err) {
    console.error('[services] POST /', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create service' } });
  }
});

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { rows: existing } = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } });
    }

    const current = existing[0];
    const { name, description, tier, price, unit } = req.body || {};

    const updatedName = name !== undefined ? name.trim() : current.name;
    const updatedDescription = description !== undefined ? description?.trim() || null : current.description;
    const updatedTier = tier !== undefined ? tier : current.tier;
    const updatedPrice = price !== undefined ? Number(price) : parseFloat(current.price);
    const updatedUnit = unit !== undefined ? unit.trim() : current.unit;

    if (!updatedName) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name cannot be empty' } });
    }
    if (!VALID_TIERS.includes(updatedTier)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `tier must be one of: ${VALID_TIERS.join(', ')}` } });
    }
    if (isNaN(updatedPrice) || updatedPrice < 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'price must be a non-negative number' } });
    }

    await db.query(
      `UPDATE services SET name=$1, description=$2, tier=$3, price=$4, unit=$5 WHERE id=$6`,
      [updatedName, updatedDescription, updatedTier, updatedPrice, updatedUnit, req.params.id]
    );

    const { rows } = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    return res.json({ success: true, data: rowToService(rows[0]) });
  } catch (err) {
    console.error('[services] PUT /:id', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update service' } });
  }
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { rows } = await db.query('SELECT id FROM services WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } });
    }
    await db.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[services] DELETE /:id', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete service' } });
  }
});

export default router;
