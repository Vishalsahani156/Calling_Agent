import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('=== Database CRUD Test ===\n');

  await prisma.$queryRaw`SELECT 1`;
  console.log('✓ Connection OK');

  const roleCount = await prisma.role.count();
  const permCount = await prisma.permission.count();
  console.log(`✓ RBAC seeded: ${roleCount} roles, ${permCount} permissions`);

  const orgAdminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.org_admin },
  });

  const testSlug = `crud-test-${Date.now()}`;
  const org = await prisma.organization.create({
    data: { name: 'CRUD Test Org', slug: testSlug },
  });
  console.log(`✓ Organization created: ${org.id}`);

  await prisma.settings.create({ data: { organizationId: org.id } });

  const user = await prisma.user.create({
    data: {
      email: `crud-${Date.now()}@test.local`,
      passwordHash: await bcrypt.hash('TestPass123!', 12),
      firstName: 'CRUD',
      lastName: 'Tester',
      organizationId: org.id,
      roleId: orgAdminRole.id,
    },
  });
  console.log(`✓ User created: ${user.id}`);

  const contact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      phone: '+919876543210',
      firstName: 'Test',
      lastName: 'Contact',
    },
  });
  console.log(`✓ Contact created: ${contact.id}`);

  const updatedContact = await prisma.contact.update({
    where: { id: contact.id },
    data: { firstName: 'Updated' },
  });
  console.log(`✓ Contact updated: ${updatedContact.firstName}`);

  const readContact = await prisma.contact.findFirst({
    where: { id: contact.id, organizationId: org.id },
  });
  if (!readContact) throw new Error('Contact read failed');
  console.log('✓ Contact read OK');

  await prisma.contact.delete({ where: { id: contact.id } });
  console.log('✓ Contact deleted');

  await prisma.user.delete({ where: { id: user.id } });
  await prisma.settings.delete({ where: { organizationId: org.id } });
  await prisma.organization.delete({ where: { id: org.id } });
  console.log('✓ Cleanup complete');

  console.log('\n=== All CRUD tests passed ===');
}

main()
  .catch((err: unknown) => {
    console.error('CRUD test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
