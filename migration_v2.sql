-- NextGenBox v2 Migration: Document, Income, Expense Category
-- Run against Supabase

-- 1. Document (Fatura/Belge) tablosu
CREATE TABLE IF NOT EXISTS "Document" (
    id TEXT PRIMARY KEY,
    "relatedType" TEXT NOT NULL,        -- 'expense' | 'investment' | 'income' | 'performance'
    "relatedId" TEXT NOT NULL,           -- ilgili kaydın ID'si
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER DEFAULT 0,
    "mimeType" TEXT DEFAULT 'application/pdf',
    "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Income (Gelir Takip) tablosu
CREATE TABLE IF NOT EXISTS "Income" (
    id TEXT PRIMARY KEY,
    "locationId" TEXT REFERENCES "Location"(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    category TEXT DEFAULT 'other',       -- 'session_revenue' | 'sponsorship' | 'refund' | 'other'
    month TEXT,                          -- 'YYYY-MM' formatı
    notes TEXT,
    "isRecurring" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Expense tablosuna category alanı ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Expense' AND column_name = 'category') THEN
        ALTER TABLE "Expense" ADD COLUMN category TEXT DEFAULT 'operational';
    END IF;
END $$;
-- Kategoriler: 'rent', 'utilities', 'maintenance', 'marketing', 'personnel', 'equipment', 'operational', 'other'

-- 4. Bozuk/NaN kayıtları temizle
DELETE FROM "Expense" WHERE "amountWithoutVat" = 'NaN'::DOUBLE PRECISION OR description IN ('ÖZET', 'HIZLA KİRALA → XND (Vergi Etkisi)', 'Para olarak gider/gelir DEĞİL. Sadece vergi: matrahtan düşülür + KDV mahsup.', 'KDV Oranı', 'Aylık KDV', 'Aylık Fatura (KDV Hariç)');
DELETE FROM "Expense" WHERE description IN ('Aylık Resmi Giderler', 'Aylık Gayriresmi Giderler', 'Tek Sefer Giderler');

DELETE FROM "Investment" WHERE "totalAmount" = 'NaN'::DOUBLE PRECISION OR description IN ('GENEL TOPLAM', 'BURSA ZAFER PLAZA', 'MAVİBAHÇE (İZMİR)');

-- 5. Supabase Storage bucket (document uploads)
-- Not: Bu komutu Supabase Dashboard üzerinden çalıştırın:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- 6. RLS Politikaları (gerekirse)
-- ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for authenticated" ON "Document" FOR ALL USING (true);
