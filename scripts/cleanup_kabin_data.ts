import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up automated KabinRapor data...');
  
  const deletedStats = await prisma.cabinDailyStat.deleteMany({});
  console.log(`Deleted ${deletedStats.count} daily statistics.`);
  
  const deletedCabins = await prisma.cabin.deleteMany({});
  console.log(`Deleted ${deletedCabins.count} cabins.`);
  
  console.log('Cleanup complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
