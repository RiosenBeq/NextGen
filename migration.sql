CREATE TABLE IF NOT EXISTS "SystemParameter" (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value DOUBLE PRECISION NOT NULL
    );
CREATE TABLE IF NOT EXISTS "Location" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "fixedRent" DOUBLE PRECISION NOT NULL,
        "duesAmount" DOUBLE PRECISION NOT NULL,
        "rentVatRate" DOUBLE PRECISION NOT NULL,
        "revenueShareRate" DOUBLE PRECISION DEFAULT 0,
        "revenueThreshold" DOUBLE PRECISION DEFAULT 0,
        "isActive" BOOLEAN DEFAULT TRUE
    );
CREATE TABLE IF NOT EXISTS "MonthlyPerformance" (
        id TEXT PRIMARY KEY,
        "locationId" TEXT NOT NULL REFERENCES "Location"(id) ON DELETE CASCADE,
        month TIMESTAMP NOT NULL,
        "sessionCount" DOUBLE PRECISION NOT NULL,
        "extraExpenseAmount" DOUBLE PRECISION DEFAULT 0,
        "extraExpenseNotes" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE IF NOT EXISTS "Expense" (
        id TEXT PRIMARY KEY,
        "locationId" TEXT REFERENCES "Location"(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        type TEXT,
        "amountWithoutVat" DOUBLE PRECISION NOT NULL,
        "isOfficial" BOOLEAN DEFAULT FALSE,
        "vatRate" DOUBLE PRECISION DEFAULT 0,
        "amountWithVat" DOUBLE PRECISION NOT NULL,
        month TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE IF NOT EXISTS "Investment" (
        id TEXT PRIMARY KEY,
        "locationId" TEXT NOT NULL REFERENCES "Location"(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        currency TEXT DEFAULT 'TL',
        "amountWithoutVat" DOUBLE PRECISION NOT NULL,
        "paymentType" TEXT DEFAULT 'Nakit',
        "vatAmount" DOUBLE PRECISION DEFAULT 0,
        "totalAmount" DOUBLE PRECISION NOT NULL,
        "shareLogic" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
TRUNCATE TABLE "Investment" CASCADE;
TRUNCATE TABLE "Expense" CASCADE;
TRUNCATE TABLE "MonthlyPerformance" CASCADE;
TRUNCATE TABLE "Location" CASCADE;
TRUNCATE TABLE "SystemParameter" CASCADE;
INSERT INTO "Location" (id, name, "fixedRent", "duesAmount", "rentVatRate", "revenueShareRate", "revenueThreshold", "isActive") VALUES ('loc_bursa_zafer_plaza', 'Bursa Zafer Plaza', 40000.0, 7500.0, 20, 15.0, 40000.0, true);
INSERT INTO "Location" (id, name, "fixedRent", "duesAmount", "rentVatRate", "revenueShareRate", "revenueThreshold", "isActive") VALUES ('loc_mavibahçe', 'Mavibahçe', 30000.0, 1000.0, 20, 15.0, 30000.0, true);
INSERT INTO "SystemParameter" (id, key, value) VALUES ('param_session_price_incl_vat', 'SESSION_PRICE_INCL_VAT', 300.0) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO "SystemParameter" (id, key, value) VALUES ('param_vat_rate', 'VAT_RATE', 20.0) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO "SystemParameter" (id, key, value) VALUES ('param_corp_tax_rate', 'CORP_TAX_RATE', 22.0) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO "SystemParameter" (id, key, value) VALUES ('param_alp_share_rate', 'ALP_SHARE_RATE', 50.0) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO "SystemParameter" (id, key, value) VALUES ('param_ngb_share_rate', 'NGB_SHARE_RATE', 50.0) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-01_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-01-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-02_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-02-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-03_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-03-01 00:00:00', 50.0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-04_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-04-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-05_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-05-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-06_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-06-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-07_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-07-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-08_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-08-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-09_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-09-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-10_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-10-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-11_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-11-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-12_loc_bursa_zafer_plaza', 'loc_bursa_zafer_plaza', '2026-12-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-01_loc_mavibahçe', 'loc_mavibahçe', '2026-01-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-02_loc_mavibahçe', 'loc_mavibahçe', '2026-02-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-03_loc_mavibahçe', 'loc_mavibahçe', '2026-03-01 00:00:00', 49.0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-04_loc_mavibahçe', 'loc_mavibahçe', '2026-04-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-05_loc_mavibahçe', 'loc_mavibahçe', '2026-05-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-06_loc_mavibahçe', 'loc_mavibahçe', '2026-06-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-07_loc_mavibahçe', 'loc_mavibahçe', '2026-07-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-08_loc_mavibahçe', 'loc_mavibahçe', '2026-08-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-09_loc_mavibahçe', 'loc_mavibahçe', '2026-09-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-10_loc_mavibahçe', 'loc_mavibahçe', '2026-10-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-11_loc_mavibahçe', 'loc_mavibahçe', '2026-11-01 00:00:00', 0, 0, NULL);
INSERT INTO "MonthlyPerformance" (id, "locationId", month, "sessionCount", "extraExpenseAmount", "extraExpenseNotes") VALUES ('perf_2026-12_loc_mavibahçe', 'loc_mavibahçe', '2026-12-01 00:00:00', 0, 0, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_7076332095768760693', NULL, 'Kamera', 'tek sefer', 2100.0, true, 2100.0, '2026-03');
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_1880046449782357262', NULL, 'Branda (İzmir)', 'tek sefer', 9000.0, false, 9000.0, '2026-03');
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_6793999832286631314', NULL, 'SuperBox', 'aylık', 2000.0, true, 2000.0, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_7502176845613964847', NULL, 'Kapı Düzeltildi', 'tek sefer', 2500.0, false, 2500.0, '2026-03');
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_215142253965596527', NULL, 'Söz Okuma Ekranı Yapıldı', 'tek sefer', 835.0, false, 835.0, '2026-03');
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_8698355070774364430', NULL, 'ÖZET', 'aylık', nan, false, nan, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_6363982721332616446', NULL, 'Aylık Resmi Giderler', 'aylık', 2000.0, false, 2000.0, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_6890147841741923735', NULL, 'Aylık Gayriresmi Giderler', 'aylık', 0.0, false, 0.0, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_6178256614738498103', NULL, 'Tek Sefer Giderler', 'aylık', 14435.0, false, 14435.0, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_8273974342879705258', NULL, 'HIZLA KİRALA → XND (Vergi Etkisi)', 'aylık', nan, false, nan, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_7232295415725293848', NULL, 'Para olarak gider/gelir DEĞİL. Sadece vergi: matrahtan düşülür + KDV mahsup.', 'aylık', nan, false, nan, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_4180068454905440037', NULL, 'Aylık Fatura (KDV Hariç)', 'aylık', 15000.0, false, 15000.0, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_2390096498045433996', NULL, 'KDV Oranı', 'aylık', 20.0, false, 20.0, NULL);
INSERT INTO "Expense" (id, "locationId", description, type, "amountWithoutVat", "isOfficial", "amountWithVat", month) VALUES ('exp_8087284538071411395', NULL, 'Aylık KDV', 'aylık', 3000.0, false, 3000.0, NULL);
INSERT INTO "Investment" (id, "locationId", description, currency, "amountWithoutVat", "totalAmount", notes) VALUES ('inv_2094201995954935060', 'loc_bursa_zafer_plaza', 'BURSA ZAFER PLAZA', 'nan', 0, nan, NULL);
INSERT INTO "Investment" (id, "locationId", description, currency, "amountWithoutVat", "totalAmount", notes) VALUES ('inv_1199427684324942789', 'loc_mavibahçe', 'MAVİBAHÇE (İZMİR)', 'nan', 0, nan, NULL);
INSERT INTO "Investment" (id, "locationId", description, currency, "amountWithoutVat", "totalAmount", notes) VALUES ('inv_4694999587951775733', 'loc_mavibahçe', 'Karaoke Box Ünitesi', 'Mavibahçe', 9500.0, nan, '9.500 USD — Hızla Kirala üzerinden alındı');
INSERT INTO "Investment" (id, "locationId", description, currency, "amountWithoutVat", "totalAmount", notes) VALUES ('inv_8584406967896872204', 'loc_mavibahçe', 'Taşıma+Kurulum+Nakliye', 'Mavibahçe', 0, nan, 'İzmir komple');
INSERT INTO "Investment" (id, "locationId", description, currency, "amountWithoutVat", "totalAmount", notes) VALUES ('inv_9198002953500570650', 'loc_mavibahçe', 'GENEL TOPLAM', 'nan', 0, nan, NULL);
INSERT INTO "Investment" (id, "locationId", description, currency, "amountWithoutVat", "totalAmount", notes) VALUES ('inv_9198002953500570650', 'loc_mavibahçe', 'GENEL TOPLAM', 'nan', 0, nan, NULL);