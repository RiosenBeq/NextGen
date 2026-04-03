import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Excel data via Prisma Client...');

  // 1. System Parameters
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SystemParameter" (id, key, value) VALUES ($1, $2, $3) 
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    'param_session_price', 'SESSION_PRICE_INCL_VAT', 300
  );

  // 2. Locations
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Location" (id, name, "fixedRent", "duesAmount", "rentVatRate", "isActive") 
     VALUES ($1, $2, $3, $4, $5, $6) 
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "fixedRent" = EXCLUDED."fixedRent", "duesAmount" = EXCLUDED."duesAmount"`,
    'loc_bursa_zafer_plaza', 'Bursa Zafer Plaza', 40000, 7500, 20, true
  );

  await prisma.$executeRawUnsafe(
    `INSERT INTO "Location" (id, name, "fixedRent", "duesAmount", "rentVatRate", "isActive") 
     VALUES ($1, $2, $3, $4, $5, $6) 
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "fixedRent" = EXCLUDED."fixedRent", "duesAmount" = EXCLUDED."duesAmount"`,
    'loc_mavibahçe', 'Mavibahçe', 30000, 1100, 20, true
  );

  // 4. Specific Expenses from Excel
  const bursaId = 'loc_bursa_zafer_plaza';
  const izmirId = 'loc_mavibahçe';

  // Kamera
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Expense" (id, description, type, "amountWithoutVat", "amountWithVat", "isOfficial", "paidBy", "locationId", "createdAt") 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) ON CONFLICT (id) DO NOTHING`,
    'excel_exp_kamera', 'Kamera Alımı (Excel)', 'FATURA', 2000, 2000, true, 'Alp', bursaId
  );

  // Branda
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Expense" (id, description, type, "amountWithoutVat", "amountWithVat", "isOfficial", "paidBy", "locationId", "createdAt") 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) ON CONFLICT (id) DO NOTHING`,
    'excel_exp_branda', 'Branda (İzmir) (Excel)', 'DİĞER', 9000, 9000, false, 'Ortak Hesap', izmirId
  );

  // SuperBox
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Expense" (id, description, type, "amountWithoutVat", "amountWithVat", "isOfficial", "paidBy", "locationId", "createdAt") 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) ON CONFLICT (id) DO NOTHING`,
    'excel_exp_superbox', 'SuperBox Aylık Abonelik', 'FATURA', 450, 450, true, 'Ortak Hesap', izmirId
  );

  // 5. Investments
  // İzmir Unit
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Investment" (id, "locationId", description, currency, "amountWithoutVat", "totalAmount", notes, "createdAt") 
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) ON CONFLICT (id) DO NOTHING`,
    'excel_inv_izmir_unit', izmirId, 'Karaoke Box Ünitesi (İzmir)', 'USD', 9500, 9500 * 33, 'Hızla Kirala üzerinden alındı'
  );

  // Bursa Unit
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Investment" (id, "locationId", description, currency, "amountWithoutVat", "totalAmount", notes, "createdAt") 
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) ON CONFLICT (id) DO NOTHING`,
    'excel_inv_bursa_unit', bursaId, 'Karaoke Box Ünitesi (Bursa)', 'USD', 10000, 10000 * 33, 'Nakit - 50/50'
  );

  console.log('Excel data seeding successful!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
