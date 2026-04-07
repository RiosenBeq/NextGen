import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const izmirLoc = await prisma.location.findFirst({
    where: { id: 'loc_mavibahçe' }
  });

  if (!izmirLoc) {
    throw new Error("İzmir (Mavibahçe) location not found");
  }

  const currentMonth = new Date().toISOString(); 

  const expensesToInsert = [
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği 1', amount: 500 },
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği 2', amount: 500 },
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği 3', amount: 500 },
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği 4', amount: 500 },
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği (Ekstra)', amount: 600 },
    { description: 'Murat Usta (İzmir) - Bakım İşçiliği', amount: 500 }
  ];

  for (const exp of expensesToInsert) {
    await prisma.expense.create({
      data: {
        locationId: izmirLoc.id,
        description: exp.description,
        type: 'ONE_TIME',
        amountWithoutVat: exp.amount,
        amountWithVat: exp.amount, // No KDV
        vatRate: 0,
        isOfficial: false,
        categoryId: 'maintenance',
        paidBy: 'Ortak Hesap',
        month: currentMonth
      }
    });
    console.log(`Eklendi: ${exp.description} - ${exp.amount} TL`);
  }

  console.log("✅ Başarıyla 6 adet bakım gideri eklendi (Ortak Hesap, KDV %0).");
}

main().catch(console.error).finally(() => prisma.$disconnect());
