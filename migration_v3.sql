-- NextGenBox v3 Migration: Gider (Expense) Geliştirmeleri
-- Run against Supabase SQL Editor

-- 1. Expense tablosuna 'paidBy' (Ödeyen Kişi/Hesap) sütunu eklenecek
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Expense' AND column_name = 'paidBy') THEN
        ALTER TABLE "Expense" ADD COLUMN "paidBy" TEXT DEFAULT 'Ortak Hesap';
    END IF;
END $$;

-- 'paidBy' varsayılan seçenekleri: 'Ortak Hesap', 'Okan', 'Berk', 'Eren', 'Taha', vb.

-- Not: Ayrıca Documents tablosundaki fatura ilişkilerini bu Expense ID'sine bağlayacağız (önceki migrationda kurulmuştu).
