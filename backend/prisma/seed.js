const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@khabirlens.com' },
    update: {},
    create: {
      fullName: 'System Admin',
      email: 'admin@khabirlens.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Create admin profile
  await prisma.admin.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
    },
  });

  console.log('✅ Admin created:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });