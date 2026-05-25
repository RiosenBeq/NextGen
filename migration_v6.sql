-- Migration v6: businessType discriminator + Café daily sales table
-- L'Affogato profile becomes "cafe" business type.
-- NextGenBox stays "karaoke" (default).
-- CafeDailySales tracks per-day totals + category breakdowns for café profiles.

BEGIN;

-- =============================================================
-- 1. Profile.businessType — karaoke veya cafe
-- =============================================================
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "businessType" TEXT NOT NULL DEFAULT 'karaoke';

UPDATE "Profile" SET "businessType" = 'cafe' WHERE "id" = 'prof_laffogato';

-- =============================================================
-- 2. CafeDailySales tablosu
-- =============================================================
CREATE TABLE IF NOT EXISTS "CafeDailySales" (
  "id"                TEXT PRIMARY KEY,
  "profileId"         TEXT NOT NULL,
  "locationId"        TEXT NOT NULL,
  "date"              TIMESTAMP(3) NOT NULL,

  "totalRevenue"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "customerCount"     INTEGER NOT NULL DEFAULT 0,

  "coffeeRevenue"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "coldDrinkRevenue"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dessertRevenue"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "foodRevenue"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "otherRevenue"      DOUBLE PRECISION NOT NULL DEFAULT 0,

  "notes"             TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CafeDailySales_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT,
  CONSTRAINT "CafeDailySales_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CafeDailySales_locationId_date_key"
  ON "CafeDailySales"("locationId", "date");
CREATE INDEX IF NOT EXISTS "CafeDailySales_profileId_idx"
  ON "CafeDailySales"("profileId");

-- =============================================================
-- 3. RLS policy
-- =============================================================
ALTER TABLE "CafeDailySales" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CafeDailySales_profile_isolation" ON "CafeDailySales";
CREATE POLICY "CafeDailySales_profile_isolation" ON "CafeDailySales"
  FOR ALL USING (public.user_has_profile_access("profileId"));

COMMIT;
