-- Migration v5: AVM bazında oturum başı ücret + yeni AVM'ler
-- Run this in Supabase SQL Editor (idempotent)

-- 1) Oturum başı ücret artık her AVM için ayrı tutulur (önceden global
--    SystemParameter.SESSION_PRICE_INCL_VAT idi). Mevcut satırlar 300 varsayılanını alır;
--    İzmir/Bursa gibi gerçek değerler Ayarlar > AVM Yönetimi'nden girilir.
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "sessionPrice" DOUBLE PRECISION NOT NULL DEFAULT 300;

-- 2) Yeni AVM'ler. Finansal değerler (kira, aidat, ciro payı, oturum ücreti)
--    sonradan Ayarlar > AVM Yönetimi ekranından düzenlenebilir.
INSERT INTO "Location"
  (id, name, "fixedRent", "duesAmount", "rentVatRate", "revenueShareRate", "revenueThreshold", "sessionPrice", "isActive")
VALUES
  ('loc_maltepe_park', 'Maltepe Park AVM', 0, 0, 20, 0, 0, 300, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Location"
  (id, name, "fixedRent", "duesAmount", "rentVatRate", "revenueShareRate", "revenueThreshold", "sessionPrice", "isActive")
VALUES
  ('loc_akyaka', 'Akyaka AVM', 0, 0, 20, 0, 0, 300, true)
ON CONFLICT (id) DO NOTHING;
