/**
 * Comprehensive Ingestion Script
 * Populates DailyPerformance for Izmir and Bursa from extracted historical data.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BURSA_ID = '78912c44-b221-4206-8dcb-c92f15598c19'; // Bursa Zafer Plaza
const IZMIR_ID = '33ea529d-43da-4702-8692-56e6d07198ba'; // Mavibahçe

async function main() {
  console.log('Ingesting all historical manual data...');

  const bursaData = [
    { date: '2026-04-05', sessionCount: 4, testCount: 0 },
    { date: '2026-04-04', sessionCount: 16, testCount: 0 },
    { date: '2026-04-03', sessionCount: 4, testCount: 0 },
    { date: '2026-04-02', sessionCount: 3, testCount: 0 },
    { date: '2026-04-01', sessionCount: 1, testCount: 0 },
    { date: '2026-03-31', sessionCount: 4, testCount: 0 },
    { date: '2026-03-30', sessionCount: 5, testCount: 1 },
    { date: '2026-03-29', sessionCount: 13, testCount: 0 },
    { date: '2026-03-28', sessionCount: 15, testCount: 2 },
    { date: '2026-03-27', sessionCount: 10, testCount: 4 },
    { date: '2026-03-26', sessionCount: 5, testCount: 0 },
    { date: '2026-03-24', sessionCount: 6, testCount: 0 },
    { date: '2026-03-23', sessionCount: 10, testCount: 1 },
    { date: '2026-03-22', sessionCount: 28, testCount: 0 },
    { date: '2026-03-21', sessionCount: 21, testCount: 0 },
    { date: '2026-03-20', sessionCount: 15, testCount: 1 },
    { date: '2026-03-19', sessionCount: 9, testCount: 1 },
    { date: '2026-03-18', sessionCount: 14, testCount: 0 },
    { date: '2026-03-17', sessionCount: 3, testCount: 0 },
    { date: '2026-03-16', sessionCount: 9, testCount: 0 },
    { date: '2026-03-15', sessionCount: 11, testCount: 1 },
    { date: '2026-03-14', sessionCount: 9, testCount: 3 },
    { date: '2026-03-13', sessionCount: 11, testCount: 0 },
    { date: '2026-02-12', sessionCount: 7, testCount: 0 },
    { date: '2026-03-09', sessionCount: 0, testCount: 1 },
  ];

  const izmirData = [
    { date: '2026-03-31', sessionCount: 12, testCount: 0 },
    { date: '2026-03-30', sessionCount: 8, testCount: 0 },
    { date: '2026-03-29', sessionCount: 15, testCount: 0 },
    { date: '2026-03-28', sessionCount: 22, testCount: 0 },
    { date: '2026-03-27', sessionCount: 14, testCount: 0 },
    { date: '2026-03-26', sessionCount: 9, testCount: 0 },
    { date: '2026-03-25', sessionCount: 11, testCount: 0 },
    { date: '2026-03-24', sessionCount: 13, testCount: 0 },
    { date: '2026-03-23', sessionCount: 7, testCount: 0 },
    { date: '2026-03-22', sessionCount: 31, testCount: 0 },
    { date: '2026-03-21', sessionCount: 25, testCount: 0 },
    { date: '2026-03-20', sessionCount: 18, testCount: 0 },
    { date: '2026-03-19', sessionCount: 12, testCount: 0 },
    { date: '2026-03-18', sessionCount: 14, testCount: 0 },
    { date: '2026-03-17', sessionCount: 10, testCount: 0 },
    { date: '2026-03-16', sessionCount: 11, testCount: 0 },
    { date: '2026-03-15', sessionCount: 28, testCount: 0 },
    { date: '2026-04-05', sessionCount: 14, testCount: 0 },
  ];

  // Ingest Bursa
  for (const row of bursaData) {
    try {
      await prisma.dailyPerformance.upsert({
        where: { locationId_date: { locationId: BURSA_ID, date: new Date(row.date) } },
        update: { sessionCount: row.sessionCount, testCount: row.testCount },
        create: { locationId: BURSA_ID, date: new Date(row.date), sessionCount: row.sessionCount, testCount: row.testCount, extraMetrics: {} }
      });
    } catch (e) {
      console.warn(`Could not ingest Bursa ${row.date}`);
    }
  }

  // Ingest Izmir
  for (const row of izmirData) {
    try {
      await prisma.dailyPerformance.upsert({
        where: { locationId_date: { locationId: IZMIR_ID, date: new Date(row.date) } },
        update: { sessionCount: row.sessionCount, testCount: row.testCount },
        create: { locationId: IZMIR_ID, date: new Date(row.date), sessionCount: row.sessionCount, testCount: row.testCount, extraMetrics: {} }
      });
    } catch (e) {
      console.warn(`Could not ingest Izmir ${row.date}`);
    }
  }

  // Aggregate to MonthlyPerformance
  const allMonths = ['2026-03', '2026-04'];
  const locations = [BURSA_ID, IZMIR_ID];

  for (const monthId of allMonths) {
    for (const locId of locations) {
      const stats = await prisma.dailyPerformance.aggregate({
        where: {
          locationId: locId,
          date: {
            gte: new Date(`${monthId}-01`),
            lt: new Date(monthId === '2026-12' ? `2027-01-01` : `2026-${String(parseInt(monthId.split('-')[1])+1).padStart(2, '0')}-01`)
          }
        },
        _sum: { sessionCount: true, testCount: true }
      });

      if (stats._sum.sessionCount !== null) {
        await prisma.monthlyPerformance.upsert({
          where: { locationId_month: { locationId: locId, month: new Date(`${monthId}-01`) } },
          update: { sessionCount: stats._sum.sessionCount },
          create: { locationId: locId, month: new Date(`${monthId}-01`), sessionCount: stats._sum.sessionCount, extraExpenseAmount: 0 }
        });
      }
    }
  }

  console.log('Ingestion complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
