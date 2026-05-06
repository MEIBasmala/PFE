const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`ALTER TABLE "nutrition_plans" ALTER COLUMN "patientId" DROP NOT NULL;`;
  await prisma.$executeRaw`ALTER TABLE "nutrition_plans" ALTER COLUMN "nutritionistId" DROP NOT NULL;`;
  console.log('✅ Columns updated to allow NULL');
}

main().catch(console.error).finally(() => prisma.$disconnect());