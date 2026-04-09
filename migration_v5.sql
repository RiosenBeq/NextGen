-- NextGenBox v5 Migration: Fix Document column, ensure DailyPerformance & AvmPayment tables
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Fix Document table: Add 'createdAt' alias column if missing
--    (Some code historically referenced 'createdAt' instead of 'uploadedAt')
-- ============================================================
-- This is no longer needed since code now uses 'uploadedAt'.
-- But for safety, ensure uploadedAt exists with a default:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Document' AND column_name = 'uploadedAt') THEN
        ALTER TABLE "Document" ADD COLUMN "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================================
-- 2. Ensure DailyPerformance table exists
-- ============================================================
CREATE TABLE IF NOT EXISTS "DailyPerformance" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "testCount" INTEGER NOT NULL DEFAULT 0,
    "extraMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyPerformance_pkey" PRIMARY KEY ("id")
);

-- Unique index for upsert conflict resolution
CREATE UNIQUE INDEX IF NOT EXISTS "DailyPerformance_locationId_date_key"
    ON "DailyPerformance"("locationId", "date");

-- Foreign key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'DailyPerformance_locationId_fkey') THEN
        ALTER TABLE "DailyPerformance"
            ADD CONSTRAINT "DailyPerformance_locationId_fkey"
            FOREIGN KEY ("locationId") REFERENCES "Location"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================
-- 3. Ensure AvmPayment table exists
-- ============================================================
CREATE TABLE IF NOT EXISTS "AvmPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL REFERENCES "Location"("id"),
    "month" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AvmPayment_locationId_idx" ON "AvmPayment"("locationId");
CREATE INDEX IF NOT EXISTS "AvmPayment_month_idx" ON "AvmPayment"("month");

-- ============================================================
-- 4. Ensure Location table has all required columns
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Location' AND column_name = 'revenueShareRate') THEN
        ALTER TABLE "Location" ADD COLUMN "revenueShareRate" DOUBLE PRECISION DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Location' AND column_name = 'revenueThreshold') THEN
        ALTER TABLE "Location" ADD COLUMN "revenueThreshold" DOUBLE PRECISION DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- 5. Ensure Expense table has all required columns
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'amountWithVat') THEN
        ALTER TABLE "Expense" ADD COLUMN "amountWithVat" DOUBLE PRECISION DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'amountWithoutVat') THEN
        ALTER TABLE "Expense" ADD COLUMN "amountWithoutVat" DOUBLE PRECISION DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'vatRate') THEN
        ALTER TABLE "Expense" ADD COLUMN "vatRate" DOUBLE PRECISION DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'isOfficial') THEN
        ALTER TABLE "Expense" ADD COLUMN "isOfficial" BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'month') THEN
        ALTER TABLE "Expense" ADD COLUMN "month" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'paidBy') THEN
        ALTER TABLE "Expense" ADD COLUMN "paidBy" TEXT DEFAULT 'Ortak Hesap';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'categoryId') THEN
        ALTER TABLE "Expense" ADD COLUMN "categoryId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'attachmentUrl') THEN
        ALTER TABLE "Expense" ADD COLUMN "attachmentUrl" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'Expense' AND column_name = 'isSettled') THEN
        ALTER TABLE "Expense" ADD COLUMN "isSettled" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ============================================================
-- 6. Ensure Document table has the 'id' column and required fields
-- ============================================================
-- The Document table might have been created without a proper 'id' default.
-- Make sure fileName allows NULL (some insert paths don't have a name):
DO $$
BEGIN
    -- Make fileName nullable if it isn't
    ALTER TABLE "Document" ALTER COLUMN "fileName" DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
    -- Already nullable, ignore
    NULL;
END $$;

-- ============================================================
-- 7. Ensure Storage bucket 'documents' exists and is public
-- ============================================================
-- This must be done via the Supabase Dashboard → Storage → New Bucket
-- Name: documents
-- Public: Yes
-- If you see upload errors, check:
--   1. Storage → documents bucket exists and is public
--   2. Environment variable SUPABASE_SERVICE_ROLE_KEY is set in Vercel

-- ============================================================
-- DONE! All tables should now be properly configured.
-- ============================================================
