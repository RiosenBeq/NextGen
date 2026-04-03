import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding parameters and locations...");

  // System Parameters
  const params = [
    { key: 'SESSION_PRICE', value: 300 },
    { key: 'KDV_RATE', value: 20 },
    { key: 'COMMISSION_RATE', value: 4 },
    { key: 'ALP_SHARE', value: 50 },
    { key: 'NGB_SHARE', value: 50 }
  ];

  for (const p of params) {
    await prisma.systemParameter.upsert({
      where: { key: p.key },
      update: { value: p.value },
      create: p
    });
  }

  // Locations
  const loc1 = await prisma.location.upsert({
    where: { id: 'bursa_zafer' },
    update: { fixedRent: 40000, duesAmount: 7500, rentVatRate: 20 },
    create: { id: 'bursa_zafer', name: 'Bursa Zafer Plaza', fixedRent: 40000, duesAmount: 7500, rentVatRate: 20 }
  });

  const loc2 = await prisma.location.upsert({
    where: { id: 'mavibahce' },
    update: { fixedRent: 30000, duesAmount: 1000, rentVatRate: 20 },
    create: { id: 'mavibahce', name: 'Mavibahçe', fixedRent: 30000, duesAmount: 1000, rentVatRate: 20 }
  });

  const performances = [
    { id: 'perf_bz_2026_03', locationId: loc1.id, month: new Date('2026-03-01T00:00:00.000Z'), sessionCount: 50, extraExpenseAmount: 0 },
    { id: 'perf_mb_2026_03', locationId: loc2.id, month: new Date('2026-03-01T00:00:00.000Z'), sessionCount: 49, extraExpenseAmount: 0 }
  ];

  for (const perf of performances) {
    await prisma.monthlyPerformance.upsert({
      where: { id: perf.id },
      update: perf,
      create: perf,
    });
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
