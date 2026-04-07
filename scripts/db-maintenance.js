const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database maintenance...");

  // 1. Sync Schema (Fix missing columns/tables)
  console.log("Syncing DailyPerformance table and Expense columns...");
  try {
    await prisma.$executeRawUnsafe(`
      -- Fix Expense table columns
      ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "attachmentUrl" text;
      ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "isSettled" boolean DEFAULT false;

      -- Create DailyPerformance table if not exists
      CREATE TABLE IF NOT EXISTS "DailyPerformance" (
        "id" text PRIMARY KEY,
        "locationId" text NOT NULL REFERENCES "Location"("id"),
        "date" timestamp with time zone NOT NULL,
        "sessionCount" integer NOT NULL DEFAULT 0,
        "testCount" integer NOT NULL DEFAULT 0,
        "extraMetrics" jsonb,
        "createdAt" timestamp with time zone DEFAULT now(),
        "updatedAt" timestamp with time zone DEFAULT now()
      );

      -- Add unique constraint to DailyPerformance
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DailyPerformance_locationId_date_key') THEN
          ALTER TABLE "DailyPerformance" ADD CONSTRAINT "DailyPerformance_locationId_date_key" UNIQUE ("locationId", "date");
        END IF;
      END $$;
    `);
    console.log("Database schema synced successfully.");
  } catch (err) {
    console.error("Error syncing schema:", err);
  }

  // 2. Update Expense Records
  console.log("Updating specific expense records for Eren and Murat Usta...");

  // Eren Usta First 3 -> March
  const erenMarchIds = [
    'e143110e-bb11-4daf-a543-e6044b6e154a',
    'c143110f-bb11-4daf-b543-e6043b6e19f4',
    'd143220f-cc11-48bf-b543-e6043b6e19f5'
  ];
  
  for (const id of erenMarchIds) {
    await prisma.expense.update({
      where: { id },
      data: { month: '2026-03' }
    });
  }

  // Eren Usta Last 500 TL (ID 4) -> April
  await prisma.expense.update({
    where: { id: 'a513267b-6e15-439c-896c-08d8279dd6bf' },
    data: { month: '2026-04' }
  });

  // Murat Usta -> April
  await prisma.expense.update({
    where: { id: '7badd1cb-2011-4d3f-835e-e7a788d62d50' },
    data: { month: '2026-04' }
  });

  console.log("Expense records updated successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
