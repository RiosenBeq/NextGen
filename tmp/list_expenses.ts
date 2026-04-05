import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findExpenses() {
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { description: { contains: 'Eren' } },
        { description: { contains: 'Murat' } }
      ]
    }
  });
  console.log(JSON.stringify(expenses, null, 2));
}

findExpenses();
