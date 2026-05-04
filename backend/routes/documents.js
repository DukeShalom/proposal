import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

const VALID_TYPES = ['proposal', 'sow', 'contract'];
const VALID_STATUSES = ['draft', 'sent', 'signed', 'declined'];

function rowToDocument(row) {
  let lineItems = row.line_items;
  if (typeof lineItems === 'string') {
    try { lineItems = JSON.parse(lineItems); } catch { lineItems = []; }
  }
  lineItems = Array.isArray(lineItems) ? lineItems : [];

  let branding = row.branding;
  if (typeof branding === 'string') {
    try { branding = JSON.parse(branding); } catch { branding = {}; }
  }
  branding = branding && typeof branding === 'object' ? branding : {};

  return {
    id: row.id,
    clientId: row.client_id,
    type: row.type,
    title: row.title,
    status: row.status,
    lineItems,
    notes: row.notes || null,
    totalAmount: parseFloat(row.total_amount) || 0,
    branding,
    createdAt: row.created_at ? row.created_at.toISOString?.() ?? row.created_at : null,
    sentAt: row.sent_at ? (row.sent_at.toISOString?.() ?? row.sent_at) : null,
    signedAt: row.signed_at ? (row.signed_at.toISOString?.() ?? row.signed_at) : null,
    signToken: row.sign_token || null,
  };
}

function computeTotal(lineItems) {
  if (!Array.isArray(lineItems)) return 0;
  return lineItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseFloat(item.quantity) || 1;
    const subtotal = price * qty;
    // Mutate in place so subtotal is stored
    item.subtotal = subtotal;
    return sum + subtotal;
  }, 0);
}

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { rows } = await db.query('SELECT * FROM documents ORDER BY created_at DESC');
    return res.json({ success: true, data: rows.map(rowToDocument) });
  } catch (err) {
    console.error('[documents] GET /', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch documents' } });
  }
});

// POST /api/documents
router.post('/', async (req, res) => {
  try {
    const { clientId, type, title, lineItems, notes, branding } = req.body || {};

    if (!clientId || typeof clientId !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'clientId is required' } });
    }
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title is required' } });
    }
    const docType = type || 'proposal';
    if (!VALID_TYPES.includes(docType)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `type must be one of: ${VALID_TYPES.join(', ')}` } });
    }

    // Validate client exists
    const db = await getDb();
    const { rows: clientRows } = await db.query('SELECT id FROM clients WHERE id = $1', [clientId]);
    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } });
    }

    const items = Array.isArray(lineItems) ? lineItems : [];
    const totalAmount = computeTotal(items);
    const brandingObj = branding && typeof branding === 'object' ? branding : {};

    const id = uuidv4();
    await db.query(
      `INSERT INTO documents (id, client_id, type, title, status, line_items, notes, total_amount, branding)
       VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8)`,
      [id, clientId, docType, title.trim(), JSON.stringify(items), notes?.trim() || null, totalAmount, JSON.stringify(brandingObj)]
    );

    const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [id]);
    return res.status(201).json({ success: true, data: rowToDocument(rows[0]) });
  } catch (err) {
    console.error('[documents] POST /', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create document' } });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }
    return res.json({ success: true, data: rowToDocument(rows[0]) });
  } catch (err) {
    console.error('[documents] GET /:id', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch document' } });
  }
});

// PUT /api/documents/:id
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { rows: existing } = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    const current = existing[0];
    const { clientId, type, title, status, lineItems, notes, branding } = req.body || {};

    // Parse current values safely
    let currentLineItems = current.line_items;
    if (typeof currentLineItems === 'string') { try { currentLineItems = JSON.parse(currentLineItems); } catch { currentLineItems = []; } }
    let currentBranding = current.branding;
    if (typeof currentBranding === 'string') { try { currentBranding = JSON.parse(currentBranding); } catch { currentBranding = {}; } }

    const updatedClientId = clientId !== undefined ? clientId : current.client_id;
    const updatedType = type !== undefined ? type : current.type;
    const updatedTitle = title !== undefined ? title.trim() : current.title;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedLineItems = lineItems !== undefined ? (Array.isArray(lineItems) ? lineItems : []) : (Array.isArray(currentLineItems) ? currentLineItems : []);
    const updatedNotes = notes !== undefined ? (notes?.trim() || null) : current.notes;
    const updatedBranding = branding !== undefined ? (branding && typeof branding === 'object' ? branding : {}) : (currentBranding || {});

    if (!updatedTitle) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title cannot be empty' } });
    }
    if (updatedType && !VALID_TYPES.includes(updatedType)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `type must be one of: ${VALID_TYPES.join(', ')}` } });
    }
    if (updatedStatus && !VALID_STATUSES.includes(updatedStatus)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${VALID_STATUSES.join(', ')}` } });
    }

    // Recompute total
    const totalAmount = computeTotal(updatedLineItems);

    await db.query(
      `UPDATE documents
       SET client_id=$1, type=$2, title=$3, status=$4, line_items=$5, notes=$6, total_amount=$7, branding=$8
       WHERE id=$9`,
      [updatedClientId, updatedType, updatedTitle, updatedStatus, JSON.stringify(updatedLineItems), updatedNotes, totalAmount, JSON.stringify(updatedBranding), req.params.id]
    );

    const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    return res.json({ success: true, data: rowToDocument(rows[0]) });
  } catch (err) {
    console.error('[documents] PUT /:id', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update document' } });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { rows } = await db.query('SELECT id FROM documents WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }
    // Delete associated signatures first
    await db.query('DELETE FROM signatures WHERE document_id = $1', [req.params.id]);
    await db.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[documents] DELETE /:id', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete document' } });
  }
});

// POST /api/documents/:id/send
router.post('/:id/send', async (req, res) => {
  try {
    const db = await getDb();
    const { rows: existing } = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    const doc = existing[0];
    if (doc.status === 'signed') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Document is already signed' } });
    }

    const token = uuidv4();
    const now = new Date().toISOString();

    await db.query(
      `UPDATE documents SET status='sent', sent_at=$1, sign_token=$2 WHERE id=$3`,
      [now, token, req.params.id]
    );

    // Build sign URL — use request host or env-configured base URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const signUrl = `${baseUrl}/sign/${token}`;

    return res.json({
      success: true,
      data: { token, signUrl },
    });
  } catch (err) {
    console.error('[documents] POST /:id/send', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to send document' } });
  }
});

export default router;
