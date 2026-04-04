const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fixing MonthlyPerformance records...");
  
  // Sadece 2026 Mart ve 2026 Nisan kalsın
  const today = new Date();
  
  const allPerformances = await prisma.monthlyPerformance.findMany();
  
  let deletedCount = 0;
  for (const perf of allPerformances) {
    const monthStr = new Date(perf.month).toISOString().slice(0, 7);
    
    // Yalnızca 2026-03 ve 2026-04 kalacak
    if (monthStr !== '2026-03' && monthStr !== '2026-04') {
      await prisma.monthlyPerformance.delete({ where: { id: perf.id } });
      deletedCount++;
    }
  }

  // Eğer 2026-04 yoksa, varsayılan bir tane ekleyelim
  const bursa = await prisma.location.findFirst({ where: { name: { contains: "Bursa" } } });
  const izmir = await prisma.location.findFirst({ where: { name: { contains: "Mavibahçe" } } });

  if (bursa) {
    const pBursa = await prisma.monthlyPerformance.findFirst({ where: { locationId: bursa.id, month: new Date("2026-04-01T00:00:00Z") }});
    if (!pBursa) {
       await prisma.monthlyPerformance.create({ data: { locationId: bursa.id, month: new Date("2026-04-01T00:00:00Z"), sessionCount: 0 }});
    }
  }
  if (izmir) {
    const pIzmir = await prisma.monthlyPerformance.findFirst({ where: { locationId: izmir.id, month: new Date("2026-04-01T00:00:00Z") }});
    if (!pIzmir) {
       await prisma.monthlyPerformance.create({ data: { locationId: izmir.id, month: new Date("2026-04-01T00:00:00Z"), sessionCount: 0 }});
    }
  }

  console.log(`Deleted ${deletedCount} fake future/past months.`);
  console.log("Only March and April 2026 remain.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
