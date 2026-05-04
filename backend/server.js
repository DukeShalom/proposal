import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema } from './db.js';
import clientsRouter from './routes/clients.js';
import servicesRouter from './routes/services.js';
import documentsRouter from './routes/documents.js';
import signRouter from './routes/sign.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── Health check ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), version: '1.0.0' });
});

// ── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/clients', clientsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/sign', signRouter);

// ── API root info ───────────────────────────────────────────────────────────

app.get('/api', (req, res) => {
  res.json({
    name: 'Proposal Generator API',
    version: '1.0.0',
    description: 'Client Proposal & Contract Generator backend',
    health: '/api/health',
    endpoints: {
      clients: '/api/clients',
      services: '/api/services',
      documents: '/api/documents',
      sign: '/api/sign/:token',
    },
    docs: '/docs',
  });
});

// ── Docs page ───────────────────────────────────────────────────────────────

app.get('/docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proposal Generator API — Docs</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f1117; color: #e2e8f0; font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.6; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
    header { background: #1a1d2e; border-bottom: 1px solid #2d3748; padding: 24px 40px; }
    header h1 { font-size: 1.6rem; font-weight: 700; color: #f8fafc; }
    header p { color: #94a3b8; margin-top: 4px; font-size: 0.95rem; }
    .container { max-width: 960px; margin: 0 auto; padding: 40px 24px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-right: 8px; }
    .get { background: #1e3a5f; color: #60a5fa; }
    .post { background: #1a3a2a; color: #34d399; }
    .put { background: #3a2e1a; color: #fbbf24; }
    .delete { background: #3a1a1a; color: #f87171; }
    .section { margin-bottom: 48px; }
    .section h2 { font-size: 1.2rem; font-weight: 600; color: #f1f5f9; border-bottom: 1px solid #2d3748; padding-bottom: 10px; margin-bottom: 20px; }
    .endpoint { background: #161b2e; border: 1px solid #2d3748; border-radius: 10px; padding: 20px 24px; margin-bottom: 16px; }
    .endpoint-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .endpoint-path { font-family: monospace; font-size: 0.95rem; color: #e2e8f0; font-weight: 600; }
    .endpoint-desc { color: #94a3b8; font-size: 0.88rem; margin-bottom: 12px; }
    pre { background: #0a0d16; border: 1px solid #2d3748; border-radius: 8px; padding: 16px; overflow-x: auto; font-size: 0.82rem; color: #a5f3fc; line-height: 1.5; }
    .label { font-size: 0.78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 12px 0 6px; }
    .pill { display: inline-flex; align-items: center; gap: 6px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 4px 12px; font-size: 0.82rem; color: #94a3b8; margin: 4px; }
    .status-ok { color: #34d399; font-weight: 700; }
  </style>
</head>
<body>
  <header>
    <h1>📄 Proposal Generator API</h1>
    <p>Client Proposal &amp; Contract Generator — REST API v1.0.0 &nbsp;·&nbsp; <a href="/api/health">Health</a> &nbsp;·&nbsp; <a href="/api">Info</a></p>
  </header>
  <div class="container">

    <div class="section">
      <h2>System</h2>
      <div class="endpoint">
        <div class="endpoint-header"><span class="badge get">GET</span><span class="endpoint-path">/api/health</span></div>
        <div class="endpoint-desc">Returns server health status and uptime.</div>
        <div class="label">Response</div>
        <pre>{ "status": "ok", "uptime": 42.3, "version": "1.0.0" }</pre>
      </div>
    </div>

    <div class="section">
      <h2>Clients</h2>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge get">GET</span><span class="endpoint-path">/api/clients</span></div>
        <div class="endpoint-desc">List all clients, newest first.</div>
        <div class="label">curl</div>
        <pre>curl http://localhost:3000/api/clients</pre>
        <div class="label">Response</div>
        <pre>{ "success": true, "data": [{ "id": "uuid", "name": "Jane Mitchell", "company": "Acme Corp", "email": "jane@acme.com", "phone": "+1 (555) 100-2000", "address": "123 Main St", "createdAt": "2024-01-15T10:00:00.000Z" }] }</pre>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge post">POST</span><span class="endpoint-path">/api/clients</span></div>
        <div class="endpoint-desc">Create a new client.</div>
        <div class="label">Body</div>
        <pre>{ "name": "Alice Walker", "company": "Walker Design", "email": "alice@walker.com", "phone": "+1 555 999 0000", "address": "42 Design St, NYC" }</pre>
        <div class="label">curl</div>
        <pre>curl -X POST http://localhost:3000/api/clients \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Alice Walker","email":"alice@walker.com","company":"Walker Design"}'</pre>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge put">PUT</span><span class="endpoint-path">/api/clients/:id</span></div>
        <div class="endpoint-desc">Update client fields (partial update supported).</div>
        <div class="label">Body</div>
        <pre>{ "phone": "+1 555 123 4567" }</pre>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge delete">DELETE</span><span class="endpoint-path">/api/clients/:id</span></div>
        <div class="endpoint-desc">Delete a client by ID.</div>
        <div class="label">Response</div>
        <pre>{ "success": true }</pre>
      </div>
    </div>

    <div class="section">
      <h2>Services</h2>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge get">GET</span><span class="endpoint-path">/api/services</span></div>
        <div class="endpoint-desc">List all available services sorted by tier and price.</div>
        <div class="label">Response</div>
        <pre>{ "success": true, "data": [{ "id": "uuid", "name": "Brand Strategy Session", "description": "...", "tier": "basic", "price": 500, "unit": "hour", "createdAt": "..." }] }</pre>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge post">POST</span><span class="endpoint-path">/api/services</span></div>
        <div class="endpoint-desc">Create a new service. tier must be basic | standard | premium.</div>
        <div class="label">Body</div>
        <pre>{ "name": "UX Research", "description": "User interviews and synthesis", "tier": "standard", "price": 2000, "unit": "flat" }</pre>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge put">PUT</span><span class="endpoint-path">/api/services/:id</span></div>
        <div class="endpoint-desc">Update service fields.</div>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge delete">DELETE</span><span class="endpoint-path">/api/services/:id</span></div>
        <div class="endpoint-desc">Delete a service by ID.</div>
      </div>
    </div>

    <div class="section">
      <h2>Documents</h2>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge get">GET</span><span class="endpoint-path">/api/documents</span></div>
        <div class="endpoint-desc">List all documents (proposals, SOWs, contracts), newest first.</div>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge post">POST</span><span class="endpoint-path">/api/documents</span></div>
        <div class="endpoint-desc">Create a new document. lineItems totals are auto-calculated.</div>
        <div class="label">Body</div>
        <pre>{
  "clientId": "uuid",
  "type": "proposal",
  "title": "Website Redesign Proposal — Acme Corp",
  "lineItems": [
    { "serviceId": "uuid", "name": "Website Design", "description": "10-page responsive site", "tier": "standard", "price": 3500, "quantity": 1, "unit": "flat" }
  ],
  "notes": "Payment due within 30 days of signing.",
  "branding": { "companyName": "My Agency", "primaryColor": "#6366f1", "tagline": "Crafting digital experiences" }
}</pre>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge get">GET</span><span class="endpoint-path">/api/documents/:id</span></div>
        <div class="endpoint-desc">Fetch a single document by ID.</div>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge put">PUT</span><span class="endpoint-path">/api/documents/:id</span></div>
        <div class="endpoint-desc">Update document fields. Can update status, line items, notes, branding.</div>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge delete">DELETE</span><span class="endpoint-path">/api/documents/:id</span></div>
        <div class="endpoint-desc">Delete document and all associated signatures.</div>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge post">POST</span><span class="endpoint-path">/api/documents/:id/send</span></div>
        <div class="endpoint-desc">Send document for signing. Generates a unique sign_token, sets status to "sent".</div>
        <div class="label">Response</div>
        <pre>{ "success": true, "data": { "token": "uuid", "signUrl": "http://yoursite.com/sign/uuid" } }</pre>
      </div>
    </div>

    <div class="section">
      <h2>E-Signing</h2>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge get">GET</span><span class="endpoint-path">/api/sign/:token</span></div>
        <div class="endpoint-desc">Fetch document and client data using the signing token (for the signing page).</div>
        <div class="label">Response</div>
        <pre>{ "success": true, "data": { "document": { ...Document }, "client": { ...Client } } }</pre>
      </div>

      <div class="endpoint">
        <div class="endpoint-header"><span class="badge post">POST</span><span class="endpoint-path">/api/sign/:token</span></div>
        <div class="endpoint-desc">Submit signature. Sets document status to "signed" and records signer details.</div>
        <div class="label">Body</div>
        <pre>{ "signerName": "Jane Mitchell", "signerEmail": "jane@acme.com", "ipAddress": "203.0.113.42" }</pre>
        <div class="label">Response</div>
        <pre>{ "success": true, "data": { "id": "uuid", "documentId": "uuid", "signerName": "Jane Mitchell", "signerEmail": "jane@acme.com", "signedAt": "2024-01-15T14:30:00.000Z", "token": "uuid" } }</pre>
      </div>
    </div>

    <div class="section">
      <h2>Error Responses</h2>
      <div class="endpoint">
        <div class="endpoint-desc">All errors follow a consistent shape:</div>
        <pre>{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "email is required" } }</pre>
        <div class="label">Error codes</div>
        <div>
          <span class="pill">NOT_FOUND — 404</span>
          <span class="pill">VALIDATION_ERROR — 400</span>
          <span class="pill">INTERNAL_ERROR — 500</span>
        </div>
      </div>
    </div>

  </div>
</body>
</html>`);
});

// ── Frontend static files ───────────────────────────────────────────────────

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes
app.get(/^(?!\/api).*$/, (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // dist not built yet — return friendly message
      res.status(200).send(`
        <html><body style="font-family:system-ui;background:#0f1117;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px;">
          <h2>🚀 Proposal Generator API</h2>
          <p style="color:#94a3b8">Backend is running. Frontend not built yet.</p>
          <a href="/docs" style="color:#60a5fa">View API Docs →</a>
        </body></html>
      `);
    }
  });
});

// ── 404 fallback for unknown API routes ────────────────────────────────────

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `No API route found for ${req.method} ${req.path}` } });
});

// ── Global error handler ────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
});

// ── Start ───────────────────────────────────────────────────────────────────

async function start() {
  try {
    console.log('[server] Initializing database schema...');
    await initSchema();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[server] Proposal Generator API running on http://0.0.0.0:${PORT}`);
      console.log(`[server] Docs available at http://0.0.0.0:${PORT}/docs`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[server] SIGTERM received — shutting down gracefully');
      server.close(() => {
        console.log('[server] HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('[server] SIGINT received — shutting down gracefully');
      server.close(() => {
        console.log('[server] HTTP server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();
