import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

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

function rowToSignature(row) {
  return {
    id: row.id,
    documentId: row.document_id,
    signerName: row.signer_name,
    signerEmail: row.signer_email,
    signedAt: row.signed_at ? (row.signed_at.toISOString?.() ?? row.signed_at) : null,
    token: row.token,
  };
}

// GET /api/sign/:token — fetch document + client by sign_token
router.get('/:token', async (req, res) => {
  try {
    const db = await getDb();
    const { rows: docRows } = await db.query(
      `SELECT * FROM documents WHERE sign_token = $1`,
      [req.params.token]
    );

    if (docRows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found for this token' } });
    }

    const doc = docRows[0];
    const { rows: clientRows } = await db.query('SELECT * FROM clients WHERE id = $1', [doc.client_id]);

    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Client associated with document not found' } });
    }

    return res.json({
      success: true,
      data: {
        document: rowToDocument(doc),
        client: rowToClient(clientRows[0]),
      },
    });
  } catch (err) {
    console.error('[sign] GET /:token', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch signing data' } });
  }
});

// POST /api/sign/:token — submit signature
router.post('/:token', async (req, res) => {
  try {
    const { signerName, signerEmail, ipAddress } = req.body || {};

    if (!signerName || typeof signerName !== 'string' || signerName.trim() === '') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'signerName is required' } });
    }
    if (!signerEmail || typeof signerEmail !== 'string' || signerEmail.trim() === '') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'signerEmail is required' } });
    }

    const db = await getDb();
    const { rows: docRows } = await db.query(
      `SELECT * FROM documents WHERE sign_token = $1`,
      [req.params.token]
    );

    if (docRows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found for this token' } });
    }

    const doc = docRows[0];

    if (doc.status === 'signed') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Document has already been signed' } });
    }
    if (doc.status === 'declined') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Document has been declined' } });
    }
    if (doc.status !== 'sent') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Document is not ready for signing' } });
    }

    const now = new Date().toISOString();
    const signatureId = uuidv4();

    // Capture IP from body or request
    const resolvedIp = ipAddress?.trim() || req.ip || req.connection?.remoteAddress || null;

    // Insert signature record
    await db.query(
      `INSERT INTO signatures (id, document_id, signer_name, signer_email, signed_at, ip_address, token)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [signatureId, doc.id, signerName.trim(), signerEmail.trim(), now, resolvedIp, req.params.token]
    );

    // Update document status to signed
    await db.query(
      `UPDATE documents SET status='signed', signed_at=$1 WHERE id=$2`,
      [now, doc.id]
    );

    const { rows: sigRows } = await db.query('SELECT * FROM signatures WHERE id = $1', [signatureId]);
    return res.status(201).json({ success: true, data: rowToSignature(sigRows[0]) });
  } catch (err) {
    console.error('[sign] POST /:token', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to record signature' } });
  }
});

export default router;
