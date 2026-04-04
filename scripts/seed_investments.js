const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting investment seed...");

  // 1. Get locations
  const bursa = await prisma.location.findFirst({ where: { name: { contains: "Bursa" } } });
  const izmir = await prisma.location.findFirst({ where: { name: { contains: "Mavibahçe" } } });

  if (!bursa || !izmir) {
    console.error("Could not find locations! Aborting.");
    return;
  }

  // Clear previous matching investments to avoid duplicates
  await prisma.investment.deleteMany({
    where: {
      description: { in: ['Karaoke Box Ünitesi', 'Nakliye → Depo', 'Nakliye Depo → Bursa', 'Taşıma+Kurulum+Nakliye'] }
    }
  });

  console.log("Cleared old matching investments.");

  // Bursa Zafer Plaza Investments (KDV'siz Nakit = 349,125 TL)
  await prisma.investment.createMany({
    data: [
      {
        locationId: bursa.id,
        description: 'Karaoke Box Ünitesi',
        amountWithoutVat: 328125,
        paymentType: 'Nakit',
        vatAmount: 0,
        totalAmount: 328125,
        shareLogic: '50/50',
        notes: "KDV'siz nakit alındı",
      },
      {
        locationId: bursa.id,
        description: 'Nakliye → Depo',
        amountWithoutVat: 6000,
        paymentType: 'Nakit',
        vatAmount: 0,
        totalAmount: 6000,
        shareLogic: '50/50',
        notes: "KDV'siz nakit alındı",
      },
      {
        locationId: bursa.id,
        description: 'Nakliye Depo → Bursa',
        amountWithoutVat: 15000,
        paymentType: 'Nakit',
        vatAmount: 0,
        totalAmount: 15000,
        shareLogic: '50/50',
        notes: "KDV'siz nakit alındı",
      }
    ]
  });

  // Mavibahçe Investments (KDV dahil Toplam = 491,375 TL)
  await prisma.investment.createMany({
    data: [
      {
        locationId: izmir.id,
        description: 'Karaoke Box Ünitesi',
        amountWithoutVat: 415625,
        paymentType: 'Nakit',
        vatAmount: 43750,
        totalAmount: 459375, // KDV Dahil total
        notes: '9.500 USD — Hızla Kirala üzerinden alındı'
      },
      {
        locationId: izmir.id,
        description: 'Taşıma+Kurulum+Nakliye',
        amountWithoutVat: 32000,
        paymentType: 'Nakit',
        vatAmount: 0,
        totalAmount: 32000, // KDV Dahil total
        notes: 'İzmir komple'
      }
    ]
  });

  console.log("Successfully seeded investment data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
