-- Migration v5: Multi-tenant profile architecture
-- Adds Profile + UserProfileAccess tables and backfills all existing data
-- to the "NextGenBox" profile. Seeds the L'Affogato profile with a
-- Maltepe Park location. Enables RLS on every scoped table.

BEGIN;

-- =============================================================
-- 1. Profile + UserProfileAccess core tables
-- =============================================================
CREATE TABLE IF NOT EXISTS "Profile" (
  "id"           TEXT PRIMARY KEY,
  "slug"         TEXT NOT NULL UNIQUE,
  "name"         TEXT NOT NULL,
  "brandName"    TEXT NOT NULL,
  "monogram"     TEXT NOT NULL,
  "primaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
  "accentColor"  TEXT NOT NULL DEFAULT '#06B6D4',
  "logoUrl"      TEXT,
  "locale"       TEXT NOT NULL DEFAULT 'tr-TR',
  "currency"     TEXT NOT NULL DEFAULT 'TRY',
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "UserProfileAccess" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL,
  "profileId"      TEXT NOT NULL,
  "role"           TEXT NOT NULL DEFAULT 'member',
  "lastSelectedAt" TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserProfileAccess_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserProfileAccess_userId_profileId_key"
  ON "UserProfileAccess"("userId", "profileId");
CREATE INDEX IF NOT EXISTS "UserProfileAccess_userId_idx"
  ON "UserProfileAccess"("userId");
CREATE INDEX IF NOT EXISTS "UserProfileAccess_profileId_idx"
  ON "UserProfileAccess"("profileId");

-- =============================================================
-- 2. Seed default profiles
-- =============================================================
INSERT INTO "Profile" ("id", "slug", "name", "brandName", "monogram", "primaryColor", "accentColor")
VALUES
  ('prof_nextgenbox', 'nextgenbox', 'NextGenBox', 'NextGenBox', 'NG', '#4F46E5', '#06B6D4'),
  ('prof_laffogato',  'laffogato',  'L''Affogato', 'L''Affogato', 'LA', '#6B4226', '#D9A86C')
ON CONFLICT ("id") DO NOTHING;

-- =============================================================
-- 3. Add profileId columns (nullable for backfill)
-- =============================================================
ALTER TABLE "Location"           ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "MonthlyPerformance" ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "DailyPerformance"   ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "Expense"            ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "Investment"         ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "AvmPayment"         ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "Note"               ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "Document"           ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "AuditLog"           ADD COLUMN IF NOT EXISTS "profileId" TEXT;
ALTER TABLE "SystemParameter"    ADD COLUMN IF NOT EXISTS "profileId" TEXT;

-- =============================================================
-- 4. Backfill: all existing rows belong to NextGenBox profile
-- =============================================================
UPDATE "Location"           SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;
UPDATE "MonthlyPerformance" SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;
UPDATE "DailyPerformance"   SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;
UPDATE "Expense"            SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;
UPDATE "Investment"         SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;
UPDATE "AvmPayment"         SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;
UPDATE "Note"               SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;
UPDATE "Document"           SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;
UPDATE "AuditLog"           SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;
UPDATE "SystemParameter"    SET "profileId" = 'prof_nextgenbox' WHERE "profileId" IS NULL;

-- =============================================================
-- 5. NOT NULL + FK + index for every scoped table
-- =============================================================
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'Location','MonthlyPerformance','DailyPerformance','Expense','Investment',
    'AvmPayment','Note','Document','AuditLog','SystemParameter'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN "profileId" SET NOT NULL', t);

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = t AND constraint_name = t || '_profileId_fkey'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT',
        t, t || '_profileId_fkey'
      );
    END IF;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I("profileId")',
      t || '_profileId_idx', t
    );
  END LOOP;
END $$;

-- =============================================================
-- 6. SystemParameter: drop global key unique, add composite unique
-- =============================================================
ALTER TABLE "SystemParameter" DROP CONSTRAINT IF EXISTS "SystemParameter_key_key";
DROP INDEX IF EXISTS "SystemParameter_key_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SystemParameter_profileId_key_key'
  ) THEN
    ALTER TABLE "SystemParameter"
      ADD CONSTRAINT "SystemParameter_profileId_key_key" UNIQUE ("profileId", "key");
  END IF;
END $$;

-- Seed L'Affogato default system parameters (mirrors NextGenBox defaults)
INSERT INTO "SystemParameter" ("id", "profileId", "key", "value")
VALUES
  ('param_laffogato_session_price', 'prof_laffogato', 'SESSION_PRICE_INCL_VAT', 300.0),
  ('param_laffogato_vat',           'prof_laffogato', 'VAT_RATE',               20.0),
  ('param_laffogato_corp_tax',      'prof_laffogato', 'CORP_TAX_RATE',          22.0),
  ('param_laffogato_alp_share',     'prof_laffogato', 'ALP_SHARE_RATE',         50.0),
  ('param_laffogato_ngb_share',     'prof_laffogato', 'NGB_SHARE_RATE',         50.0)
ON CONFLICT ("profileId", "key") DO NOTHING;

-- =============================================================
-- 7. Seed L'Affogato Maltepe Park location
-- =============================================================
INSERT INTO "Location" ("id", "profileId", "name", "fixedRent", "duesAmount", "rentVatRate", "revenueShareRate", "revenueThreshold", "isActive")
VALUES ('loc_laffogato_maltepe_park', 'prof_laffogato', 'Maltepe Park', 0, 0, 20, 0, 0, true)
ON CONFLICT ("id") DO NOTHING;

-- =============================================================
-- 8. Grant existing superadmin access to BOTH profiles
-- =============================================================
INSERT INTO "UserProfileAccess" ("id", "userId", "profileId", "role")
SELECT
  'upa_' || u.id || '_nextgenbox',
  u.id::text,
  'prof_nextgenbox',
  'owner'
FROM auth.users u
WHERE u.email = 'nextonmuzik@gmail.com'
ON CONFLICT ("userId", "profileId") DO NOTHING;

INSERT INTO "UserProfileAccess" ("id", "userId", "profileId", "role")
SELECT
  'upa_' || u.id || '_laffogato',
  u.id::text,
  'prof_laffogato',
  'owner'
FROM auth.users u
WHERE u.email = 'nextonmuzik@gmail.com'
ON CONFLICT ("userId", "profileId") DO NOTHING;

-- =============================================================
-- 9. RLS helper function + policies
-- =============================================================
CREATE OR REPLACE FUNCTION public.user_has_profile_access(p_profile_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "UserProfileAccess"
    WHERE "profileId" = p_profile_id
      AND "userId"    = auth.uid()::text
  );
$$;

ALTER TABLE "Profile"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserProfileAccess"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Location"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MonthlyPerformance"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyPerformance"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Investment"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AvmPayment"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemParameter"     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profile_visible_to_members" ON "Profile";
CREATE POLICY "Profile_visible_to_members" ON "Profile"
  FOR SELECT USING (public.user_has_profile_access("id"));

DROP POLICY IF EXISTS "UserProfileAccess_self" ON "UserProfileAccess";
CREATE POLICY "UserProfileAccess_self" ON "UserProfileAccess"
  FOR SELECT USING ("userId" = auth.uid()::text);

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'Location','MonthlyPerformance','DailyPerformance','Expense','Investment',
    'AvmPayment','Note','Document','AuditLog','SystemParameter'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_profile_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (public.user_has_profile_access("profileId"))',
      t || '_profile_isolation', t
    );
  END LOOP;
END $$;

COMMIT;
