import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEXTGENBOX_PROFILE_ID = 'prof_nextgenbox';

async function main() {
  console.log("Seeding parameters and locations for NextGenBox profile...");

  await prisma.profile.upsert({
    where: { id: NEXTGENBOX_PROFILE_ID },
    update: {},
    create: {
      id: NEXTGENBOX_PROFILE_ID,
      slug: 'nextgenbox',
      name: 'NextGenBox',
      brandName: 'NextGenBox',
      monogram: 'NG',
      primaryColor: '#4F46E5',
      accentColor: '#06B6D4',
    },
  });

  const params = [
    { key: 'SESSION_PRICE', value: 300 },
    { key: 'KDV_RATE', value: 20 },
    { key: 'COMMISSION_RATE', value: 4 },
    { key: 'ALP_SHARE', value: 50 },
    { key: 'NGB_SHARE', value: 50 }
  ];

  for (const p of params) {
    await prisma.systemParameter.upsert({
      where: { profileId_key: { profileId: NEXTGENBOX_PROFILE_ID, key: p.key } },
      update: { value: p.value },
      create: { profileId: NEXTGENBOX_PROFILE_ID, key: p.key, value: p.value },
    });
  }

  const loc1 = await prisma.location.upsert({
    where: { id: 'bursa_zafer' },
    update: { fixedRent: 40000, duesAmount: 7500, rentVatRate: 20 },
    create: { id: 'bursa_zafer', profileId: NEXTGENBOX_PROFILE_ID, name: 'Bursa Zafer Plaza', fixedRent: 40000, duesAmount: 7500, rentVatRate: 20 }
  });

  const loc2 = await prisma.location.upsert({
    where: { id: 'mavibahce' },
    update: { fixedRent: 30000, duesAmount: 1000, rentVatRate: 20 },
    create: { id: 'mavibahce', profileId: NEXTGENBOX_PROFILE_ID, name: 'Mavibahçe', fixedRent: 30000, duesAmount: 1000, rentVatRate: 20 }
  });

  const performances = [
    { id: 'perf_bz_2026_03', profileId: NEXTGENBOX_PROFILE_ID, locationId: loc1.id, month: new Date('2026-03-01T00:00:00.000Z'), sessionCount: 50, extraExpenseAmount: 0 },
    { id: 'perf_mb_2026_03', profileId: NEXTGENBOX_PROFILE_ID, locationId: loc2.id, month: new Date('2026-03-01T00:00:00.000Z'), sessionCount: 49, extraExpenseAmount: 0 }
  ];

  for (const perf of performances) {
    await prisma.monthlyPerformance.upsert({ where: { id: perf.id }, update: perf, create: perf });
  }

  // Seed Expenses
  const expenses = [
    { id: 'exp_01', profileId: NEXTGENBOX_PROFILE_ID, description: 'Kamera', amountWithoutVat: 2100, isOfficial: true, vatRate: 20, amountWithVat: 2520, locationId: null, type: 'tek sefer', month: '2026-03' },
    { id: 'exp_02', profileId: NEXTGENBOX_PROFILE_ID, description: 'Branda (İzmir)', amountWithoutVat: 9000, isOfficial: false, vatRate: 20, amountWithVat: 9000, locationId: loc2.id, type: 'tek sefer', month: '2026-03' },
    { id: 'exp_03', profileId: NEXTGENBOX_PROFILE_ID, description: 'SuperBox', amountWithoutVat: 2000, isOfficial: true, vatRate: 20, amountWithVat: 2400, locationId: null, type: 'aylık', month: null },
    { id: 'exp_04', profileId: NEXTGENBOX_PROFILE_ID, description: 'Kapı Düzeltildi', amountWithoutVat: 2500, isOfficial: false, vatRate: 20, amountWithVat: 2500, locationId: loc1.id, type: 'tek sefer', month: '2026-03' },
    { id: 'exp_05', profileId: NEXTGENBOX_PROFILE_ID, description: 'Söz Okuma Ekranı Yapıldı', amountWithoutVat: 835, isOfficial: false, vatRate: 20, amountWithVat: 835, locationId: loc2.id, type: 'tek sefer', month: '2026-03' }
  ];

  for (const exp of expenses) {
    await prisma.expense.upsert({ where: { id: exp.id }, update: exp, create: exp });
  }

  // Seed Investments
  const investments = [
    { id: 'inv_01', profileId: NEXTGENBOX_PROFILE_ID, description: 'Karaoke Box Ünitesi', locationId: loc1.id, currency: 'USD', amountWithoutVat: 7500, paymentType: 'Nakit', vatAmount: 0, totalAmount: 328125, notes: '50/50 - Nakit' },
    { id: 'inv_02', profileId: NEXTGENBOX_PROFILE_ID, description: 'Nakliye → Depo', locationId: loc1.id, currency: 'TL', amountWithoutVat: 6000, paymentType: 'Nakit', vatAmount: 0, totalAmount: 6000, notes: '50/50' },
    { id: 'inv_03', profileId: NEXTGENBOX_PROFILE_ID, description: 'Nakliye Depo → Bursa', locationId: loc1.id, currency: 'TL', amountWithoutVat: 15000, paymentType: 'Nakit', vatAmount: 0, totalAmount: 15000, notes: '50/50' },
    { id: 'inv_04', profileId: NEXTGENBOX_PROFILE_ID, description: 'Karaoke Box Ünitesi', locationId: loc2.id, currency: 'USD', amountWithoutVat: 9500, paymentType: 'Nakit', vatAmount: 43750, totalAmount: 459375, notes: 'Hızla Kirala' },
    { id: 'inv_05', profileId: NEXTGENBOX_PROFILE_ID, description: 'Taşıma+Kurulum+Nakliye', locationId: loc2.id, currency: 'TL', amountWithoutVat: 32000, paymentType: 'Nakit', vatAmount: 0, totalAmount: 32000, notes: 'İzmir komple' }
  ];

  for (const inv of investments) {
    await prisma.investment.upsert({ where: { id: inv.id }, update: inv, create: inv });
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
