const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database maintenance (split commands)...");

  const commands = [
    'ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "attachmentUrl" text;',
    'ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "isSettled" boolean DEFAULT false;',
    'CREATE TABLE IF NOT EXISTS "DailyPerformance" ( "id" text PRIMARY KEY, "locationId" text NOT NULL REFERENCES "Location"("id"), "date" timestamp with time zone NOT NULL, "sessionCount" integer NOT NULL DEFAULT 0, "testCount" integer NOT NULL DEFAULT 0, "extraMetrics" jsonb, "createdAt" timestamp with time zone DEFAULT now(), "updatedAt" timestamp with time zone DEFAULT now() );',
    'ALTER TABLE "DailyPerformance" ADD CONSTRAINT "DailyPerformance_locationId_date_key" UNIQUE ("locationId", "date");',
    'UPDATE "Expense" SET "month" = \'2026-03\' WHERE "id" = \'e143110e-bb11-4daf-a543-e6044b6e154a\'',
    'UPDATE "Expense" SET "month" = \'2026-03\' WHERE "id" = \'c143110f-bb11-4daf-b543-e6043b6e19f4\'',
    'UPDATE "Expense" SET "month" = \'2026-03\' WHERE "id" = \'d143220f-cc11-48bf-b543-e6043b6e19f5\'',
    'UPDATE "Expense" SET "month" = \'2026-04\' WHERE "id" = \'a513267b-6e15-439c-896c-08d8279dd6bf\'',
    'UPDATE "Expense" SET "month" = \'2026-04\' WHERE "id" = \'7badd1cb-2011-4d3f-835e-e7a788d62d50\''
  ];

  for (const cmd of commands) {
    console.log(`Executing: ${cmd.substring(0, 50)}...`);
    try {
      await prisma.$executeRawUnsafe(cmd);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log("   (Skipped: already exists)");
      } else {
        console.error("   Error:", err.message);
      }
    }
  }

  console.log("Database maintenance complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
