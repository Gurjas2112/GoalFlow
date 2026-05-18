import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with minimal demo data...');

  // Create departments
  const engineering = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering' },
  });

  const sales = await prisma.department.upsert({
    where: { name: 'Sales' },
    update: {},
    create: { name: 'Sales' },
  });

  const operations = await prisma.department.upsert({
    where: { name: 'Operations' },
    update: {},
    create: { name: 'Operations' },
  });

  const hr = await prisma.department.upsert({
    where: { name: 'HR' },
    update: {},
    create: { name: 'HR' },
  });

  const finance = await prisma.department.upsert({
    where: { name: 'Finance' },
    update: {},
    create: { name: 'Finance' },
  });

  // Create minimal demo data (just 1 admin for testing)
  const adminHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'demo-admin@goalflow.test' },
    update: {},
    create: {
      name: 'Demo Admin',
      email: 'demo-admin@goalflow.test',
      passwordHash: adminHash,
      role: 'ADMIN',
      departmentId: hr.id,
    },
  });


  console.log('✅ Seed complete!');
  console.log('');
  console.log('📋 Demo credentials:');
  console.log('  Admin: demo-admin@goalflow.test / Admin@123');
  console.log('');
  console.log('🔄 Real Azure AD users will be synced on API startup');
  console.log('💡 To manually sync Azure AD users, POST to: /api/sync/azure-users');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
