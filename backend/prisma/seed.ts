import {
  PrismaClient,
  RoleName,
  OrganizationPlan,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { resource: 'campaigns', action: 'read' },
  { resource: 'campaigns', action: 'write' },
  { resource: 'campaigns', action: 'delete' },
  { resource: 'contacts', action: 'read' },
  { resource: 'contacts', action: 'write' },
  { resource: 'contacts', action: 'delete' },
  { resource: 'calls', action: 'read' },
  { resource: 'calls', action: 'write' },
  { resource: 'knowledge', action: 'read' },
  { resource: 'knowledge', action: 'write' },
  { resource: 'knowledge', action: 'delete' },
  { resource: 'agents', action: 'read' },
  { resource: 'agents', action: 'write' },
  { resource: 'agents', action: 'delete' },
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'write' },
  { resource: 'users', action: 'delete' },
  { resource: 'settings', action: 'read' },
  { resource: 'settings', action: 'write' },
  { resource: 'analytics', action: 'read' },
] as const;

const ROLES: Array<{
  name: RoleName;
  description: string;
  isSystem: boolean;
}> = [
  {
    name: RoleName.super_admin,
    description: 'Platform super administrator with full access',
    isSystem: true,
  },
  {
    name: RoleName.org_admin,
    description: 'Organization administrator',
    isSystem: true,
  },
  {
    name: RoleName.manager,
    description: 'Campaign and team manager',
    isSystem: true,
  },
  {
    name: RoleName.agent,
    description: 'Call agent with limited access',
    isSystem: true,
  },
  {
    name: RoleName.viewer,
    description: 'Read-only access across resources',
    isSystem: true,
  },
];

function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

function getRolePermissions(role: RoleName): string[] {
  const all = PERMISSIONS.map((p) => permissionKey(p.resource, p.action));

  switch (role) {
    case RoleName.super_admin:
      return all;

    case RoleName.org_admin:
      return all;

    case RoleName.manager:
      return all.filter(
        (key) =>
          !key.startsWith('users:') ||
          key === 'users:read' ||
          key === 'settings:read',
      );

    case RoleName.agent:
      return [
        'campaigns:read',
        'contacts:read',
        'calls:read',
        'calls:write',
        'knowledge:read',
        'agents:read',
        'analytics:read',
      ];

    case RoleName.viewer:
      return all.filter((key) => key.endsWith(':read'));

    default:
      return [];
  }
}

async function seedPermissions(): Promise<Map<string, string>> {
  const permissionIds = new Map<string, string>();

  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        resource: perm.resource,
        action: perm.action,
      },
    });

    permissionIds.set(permissionKey(perm.resource, perm.action), record.id);
  }

  return permissionIds;
}

async function seedRoles(): Promise<Map<RoleName, string>> {
  const roleIds = new Map<RoleName, string>();

  for (const role of ROLES) {
    const record = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        isSystem: role.isSystem,
      },
      create: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });

    roleIds.set(role.name, record.id);
  }

  return roleIds;
}

async function seedRolePermissions(
  roleIds: Map<RoleName, string>,
  permissionIds: Map<string, string>,
): Promise<void> {
  for (const [roleName, roleId] of roleIds.entries()) {
    const allowed = getRolePermissions(roleName);

    for (const key of allowed) {
      const permissionId = permissionIds.get(key);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    }
  }
}

async function seedDevData(roleIds: Map<RoleName, string>): Promise<void> {
  const orgAdminRoleId = roleIds.get(RoleName.org_admin);
  if (!orgAdminRoleId) {
    throw new Error('org_admin role not found');
  }

  const email = process.env.DEV_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.DEV_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {
      name: 'Demo Organization',
    },
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: OrganizationPlan.starter,
      settings: {},
    },
  });

  await prisma.settings.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      exotelConfig: {},
      notificationPrefs: {},
      featureFlags: {},
    },
  });

  await prisma.user.upsert({
    where: { email },
    update: {
      firstName: 'Demo',
      lastName: 'Admin',
      organizationId: organization.id,
      roleId: orgAdminRoleId,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      firstName: 'Demo',
      lastName: 'Admin',
      organizationId: organization.id,
      roleId: orgAdminRoleId,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Dev organization seeded: ${organization.slug}`);
  console.log(`Dev admin user: ${email}`);
}

async function main(): Promise<void> {
  console.log('Seeding permissions...');
  const permissionIds = await seedPermissions();

  console.log('Seeding roles...');
  const roleIds = await seedRoles();

  console.log('Seeding role permissions...');
  await seedRolePermissions(roleIds, permissionIds);

  if (process.env.SEED_DEV_DATA === 'true') {
    console.log('Seeding dev organization and admin user...');
    await seedDevData(roleIds);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
