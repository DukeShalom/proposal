import { createRequire } from 'module';

let db = null;

async function getDb() {
  if (db) return db;

  if (process.env.DATABASE_URL) {
    // Production: use pg.Pool
    const { default: pg } = await import('pg');
    const { Pool } = pg;

    let connStr = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, '');

    const pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
    });

    db = {
      async query(sql, params = []) {
        const client = await pool.connect();
        try {
          return await client.query(sql, params);
        } finally {
          client.release();
        }
      },
    };

    console.log('[db] Connected to PostgreSQL via pg.Pool');
  } else {
    // Development: use PGlite
    const { PGlite } = await import('@electric-sql/pglite');
    const pglite = new PGlite('/tmp/pglite-data');
    await pglite.waitReady;

    db = {
      async query(sql, params = []) {
        const result = await pglite.query(sql, params);
        return { rows: result.rows };
      },
    };

    console.log('[db] Connected to PGlite at /tmp/pglite-data');
  }

  return db;
}

async function initSchema() {
  const db = await getDb();

  const statements = [
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      tier TEXT NOT NULL DEFAULT 'standard',
      price NUMERIC NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'flat',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      type TEXT NOT NULL DEFAULT 'proposal',
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      line_items JSONB NOT NULL DEFAULT '[]',
      notes TEXT,
      total_amount NUMERIC NOT NULL DEFAULT 0,
      branding JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      sent_at TIMESTAMPTZ,
      signed_at TIMESTAMPTZ,
      sign_token TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS signatures (
      id TEXT PRIMARY KEY,
      document_id TEXT REFERENCES documents(id),
      signer_name TEXT NOT NULL,
      signer_email TEXT NOT NULL,
      signed_at TIMESTAMPTZ DEFAULT NOW(),
      ip_address TEXT,
      token TEXT NOT NULL
    )`,
  ];

  for (const sql of statements) {
    await db.query(sql);
  }

  console.log('[db] Schema initialized');

  await seedData(db);
}

async function seedData(db) {
  const { rows } = await db.query('SELECT COUNT(*) AS cnt FROM clients');
  const count = parseInt(rows[0].cnt, 10);
  if (count > 0) {
    console.log('[db] Seed data already present, skipping');
    return;
  }

  const { v4: uuidv4 } = await import('uuid');

  // Seed clients
  const clients = [
    {
      id: uuidv4(),
      name: 'Jane Mitchell',
      company: 'Acme Corp',
      email: 'jane@acme.com',
      phone: '+1 (555) 100-2000',
      address: '123 Main St, New York, NY 10001',
    },
    {
      id: uuidv4(),
      name: 'Liam Chen',
      company: 'BlueSky Digital',
      email: 'liam@blueskydigital.com',
      phone: '+1 (555) 300-4000',
      address: '456 Innovation Ave, San Francisco, CA 94107',
    },
    {
      id: uuidv4(),
      name: 'Sofia Ramirez',
      company: 'Nova Startup',
      email: 'sofia@novastartup.io',
      phone: '+1 (555) 500-6000',
      address: '789 Startup Blvd, Austin, TX 73301',
    },
  ];

  for (const c of clients) {
    await db.query(
      `INSERT INTO clients (id, name, company, email, phone, address) VALUES ($1, $2, $3, $4, $5, $6)`,
      [c.id, c.name, c.company, c.email, c.phone, c.address]
    );
  }

  // Seed services
  const services = [
    {
      id: uuidv4(),
      name: 'Brand Strategy Session',
      description: 'A focused workshop to define your brand positioning, voice, and competitive advantage.',
      tier: 'basic',
      price: 500,
      unit: 'hour',
    },
    {
      id: uuidv4(),
      name: 'Logo Design',
      description: 'Custom logo design with up to 3 concept directions and 2 rounds of revisions.',
      tier: 'basic',
      price: 800,
      unit: 'flat',
    },
    {
      id: uuidv4(),
      name: 'Website Design',
      description: 'Full-featured responsive website design including up to 10 pages and CMS integration.',
      tier: 'standard',
      price: 3500,
      unit: 'flat',
    },
    {
      id: uuidv4(),
      name: 'SEO Audit',
      description: 'Comprehensive technical and on-page SEO audit with prioritized action plan.',
      tier: 'standard',
      price: 1200,
      unit: 'flat',
    },
    {
      id: uuidv4(),
      name: 'Full Brand Identity',
      description: 'Complete brand identity system: logo, color palette, typography, brand guidelines, and collateral templates.',
      tier: 'premium',
      price: 8500,
      unit: 'flat',
    },
    {
      id: uuidv4(),
      name: 'Digital Marketing Retainer',
      description: 'Ongoing digital marketing management including SEO, paid ads, content, and monthly reporting.',
      tier: 'premium',
      price: 2500,
      unit: 'month',
    },
  ];

  for (const s of services) {
    await db.query(
      `INSERT INTO services (id, name, description, tier, price, unit) VALUES ($1, $2, $3, $4, $5, $6)`,
      [s.id, s.name, s.description, s.tier, s.price, s.unit]
    );
  }

  console.log('[db] Seed data inserted: 3 clients, 6 services');
}

export { getDb, initSchema };
