import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking and creating Note table...");
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Note" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT,
        "color" TEXT NOT NULL DEFAULT 'zinc',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log("Note table is ready!");
  } catch (e) {
    console.error("Error creating Note table:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
