const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BURSA_ID = '78912c44-b221-4206-8dcb-c92f15598c19'; 
const IZMIR_ID = '33ea529d-43da-4702-8692-56e6d07198ba';

async function main() {
  console.log('Reconciling authoritative investments and expenses...');

  // 1. Clear existing investments and specific expenses identifying with the reconcile process
  // Note: Standard data entry by user remains, we just sync these authoritative ones
  await prisma.investment.deleteMany({});
  
  // 2. Insert Investments
  const investments = [
    { 
      locationId: BURSA_ID, 
      description: 'Bursa Yatırım (Box + Kurulum)', 
      amountWithoutVat: 349125, 
      totalAmount: 349125, 
      vatAmount: 0 
    },
    { 
      locationId: IZMIR_ID, 
      description: 'İzmir Yatırım (Box + Kurulum)', 
      amountWithoutVat: 491375, 
      totalAmount: 491375, 
      vatAmount: 0 
    }
  ];

  for (const inv of investments) {
    await prisma.investment.create({ data: inv });
  }

  // 3. Clear/Sync Authoritative Expenses (March 2026)
  // We identify these by description to avoid wiping other user data
  const authDescriptions = ['Kamera', 'Branda (İzmir)', 'SuperBox', 'Kapı Düzeltildi', 'Söz Okuma Ekranı Yapıldı'];
  await prisma.expense.deleteMany({
    where: { description: { in: authDescriptions } }
  });

  const authoritativeExpenses = [
    {
      description: 'Kamera',
      locationId: null, // "Tümü"
      type: 'ONE_TIME',
      amountWithoutVat: 2100,
      vatRate: 20,
      amountWithVat: 2520,
      isOfficial: true,
      month: '2026-03',
      paidBy: 'Ortak Hesap'
    },
    {
      description: 'Branda (İzmir)',
      locationId: IZMIR_ID,
      type: 'ONE_TIME',
      amountWithoutVat: 9000,
      vatRate: 0, // KDV Hayır (Görselde 0 TL KDV tutarı)
      amountWithVat: 9000,
      isOfficial: false,
      month: '2026-03'
    },
    {
      description: 'SuperBox',
      locationId: null, // "Tümü"
      type: 'RECURRING',
      amountWithoutVat: 2000,
      vatRate: 20,
      amountWithVat: 2400,
      isOfficial: true,
      month: null
    },
    {
      description: 'Kapı Düzeltildi',
      locationId: BURSA_ID,
      type: 'ONE_TIME',
      amountWithoutVat: 2500,
      vatRate: 0,
      amountWithVat: 2500,
      isOfficial: false,
      month: '2026-03'
    },
    {
      description: 'Söz Okuma Ekranı Yapıldı',
      locationId: IZMIR_ID,
      type: 'ONE_TIME',
      amountWithoutVat: 835,
      vatRate: 0,
      amountWithVat: 835,
      isOfficial: false,
      month: '2026-03'
    }
  ];

  for (const exp of authoritativeExpenses) {
    await prisma.expense.create({ data: exp });
  }

  console.log('Authoritative data reconciliation complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
