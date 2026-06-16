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
      return all.filter((key) => !key.startsWith('users:'));

    case RoleName.manager:
      return all.filter(
        (key) => !key.startsWith('users:') && key !== 'settings:write',
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
  await prisma.rolePermission.deleteMany({});

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

async function seedPlatformOrganization(): Promise<void> {
  const organization = await prisma.organization.upsert({
    where: { slug: 'platform' },
    update: { name: 'Platform' },
    create: {
      name: 'Platform',
      slug: 'platform',
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

  console.log(`Platform organization ready: ${organization.slug}`);
}

async function seedDevData(roleIds: Map<RoleName, string>): Promise<void> {
  const superAdminRoleId = roleIds.get(RoleName.super_admin);
  if (!superAdminRoleId) {
    throw new Error('super_admin role not found');
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: 'platform' },
  });
  if (!organization) {
    throw new Error('platform organization not found');
  }

  const email = process.env.DEV_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.DEV_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const existingSuperAdmins = await prisma.user.count({
    where: {
      role: { name: RoleName.super_admin },
      deletedAt: null,
    },
  });

  if (existingSuperAdmins > 0) {
    const existing = await prisma.user.findFirst({
      where: {
        email,
        role: { name: RoleName.super_admin },
        deletedAt: null,
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          organizationId: organization.id,
          roleId: superAdminRoleId,
          isActive: true,
          deletedAt: null,
        },
      });
      console.log(`Super admin updated: ${email}`);
      return;
    }

    console.log('Super admin already exists; skipping duplicate super admin seed');
    return;
  }

  await prisma.user.upsert({
    where: { email },
    update: {
      firstName: 'Super',
      lastName: 'Admin',
      organizationId: organization.id,
      roleId: superAdminRoleId,
      passwordHash,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      organizationId: organization.id,
      roleId: superAdminRoleId,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Super admin user: ${email}`);
}

async function main(): Promise<void> {
  console.log('Seeding permissions...');
  const permissionIds = await seedPermissions();

  console.log('Seeding roles...');
  const roleIds = await seedRoles();

  console.log('Seeding role permissions...');
  await seedRolePermissions(roleIds, permissionIds);

  console.log('Seeding platform organization...');
  await seedPlatformOrganization();

  if (process.env.SEED_DEV_DATA === 'true') {
    console.log('Seeding super admin user...');
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
