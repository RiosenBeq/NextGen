const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateExpenses() {
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        OR: [
          { description: { contains: 'Eren' } },
          { description: { contains: 'Murat' } }
        ]
      }
    });
    
    console.log('Found expenses:', expenses.length);
    
    for (const exp of expenses) {
      console.log(`Updating ${exp.id}: ${exp.description}`);
      await prisma.expense.update({
        where: { id: exp.id },
        data: {
          month: '2026-03-15', // March 2026
          createdAt: new Date('2026-03-15T12:00:00Z')
        }
      });
    }
    
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

updateExpenses();
