import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.POSTGRES_URL_NON_POOLING;

async function setup() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to database...');

  try {
    // Create AuditLog table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "action" TEXT NOT NULL,
        "entity" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "details" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('AuditLog table is ready!');

    // Create Document table (if not exists)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Document" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "fileUrl" TEXT NOT NULL,
        "fileName" TEXT,
        "relatedType" TEXT NOT NULL,
        "relatedId" TEXT NOT NULL,
        "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Document table is ready!');

  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await client.end();
  }
}

setup();
