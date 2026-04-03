import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const client = new pg.Client({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL
});

async function run() {
  await client.connect();
  console.log("Connected to db");
  await client.query(`
    CREATE TABLE IF NOT EXISTS notes (
        id bigint primary key generated always as identity,
        title text not null
    );
    ALTER TABLE "public"."notes" 
    ADD COLUMN IF NOT EXISTS "content" TEXT,
    ADD COLUMN IF NOT EXISTS "color" TEXT DEFAULT 'blue',
    ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `);
  console.log("Updated notes table");
  await client.end();
}
run();
