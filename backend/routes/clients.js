import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

// Map DB row to camelCase Client object
function rowToClient(row) {
  return {
    id: row.id,
    name: row.name,
    company: row.company || null,
    email: row.email,
    phone: row.phone || null,
    address: row.address || null,
    createdAt: row.created_at ? row.created_at.toISOString?.() ?? row.created_at : null,
  };
}

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { rows } = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
    return res.json({ success: true, data: rows.map(rowToClient) });
  } catch (err) {
    console.error('[clients] GET /', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch clients' } });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const { name, company, email, phone, address } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'email is required' } });
    }

    const id = uuidv4();
    const db = await getDb();
    await db.query(
      `INSERT INTO clients (id, name, company, email, phone, address) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, name.trim(), company?.trim() || null, email.trim(), phone?.trim() || null, address?.trim() || null]
    );

    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
    return res.status(201).json({ success: true, data: rowToClient(rows[0]) });
  } catch (err) {
    console.error('[clients] POST /', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create client' } });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } });
    }
    return res.json({ success: true, data: rowToClient(rows[0]) });
  } catch (err) {
    console.error('[clients] GET /:id', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch client' } });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { rows: existing } = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } });
    }

    const current = existing[0];
    const { name, company, email, phone, address } = req.body || {};

    const updatedName = name !== undefined ? name.trim() : current.name;
    const updatedEmail = email !== undefined ? email.trim() : current.email;
    const updatedCompany = company !== undefined ? company?.trim() || null : current.company;
    const updatedPhone = phone !== undefined ? phone?.trim() || null : current.phone;
    const updatedAddress = address !== undefined ? address?.trim() || null : current.address;

    if (!updatedName) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name cannot be empty' } });
    }
    if (!updatedEmail) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'email cannot be empty' } });
    }

    await db.query(
      `UPDATE clients SET name=$1, company=$2, email=$3, phone=$4, address=$5 WHERE id=$6`,
      [updatedName, updatedCompany, updatedEmail, updatedPhone, updatedAddress, req.params.id]
    );

    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    return res.json({ success: true, data: rowToClient(rows[0]) });
  } catch (err) {
    console.error('[clients] PUT /:id', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update client' } });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { rows } = await db.query('SELECT id FROM clients WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } });
    }
    await db.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[clients] DELETE /:id', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete client' } });
  }
});

export default router;
