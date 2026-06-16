import { RoleName } from '@prisma/client';
import { prisma } from '../../config/database';
import { ASSIGNABLE_ROLE_NAMES } from '../../shared/constants/platform';

export class UsersRepository {
  findMany(skip: number, limit: number, search?: string) {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { role: true, organization: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  count(search?: string) {
    return prisma.user.count({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true, organization: true },
    });
  }

  findByEmail(email: string) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findRoleById(id: string) {
    return prisma.role.findUnique({ where: { id } });
  }

  create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    organizationId: string;
    roleId: string;
  }) {
    return prisma.user.create({
      data,
      include: { role: true, organization: true },
    });
  }

  update(id: string, data: Record<string, unknown>) {
    return prisma.user.update({
      where: { id },
      data,
      include: { role: true, organization: true },
    });
  }

  softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  listRoles(assignableOnly = false) {
    return prisma.role.findMany({
      where: assignableOnly
        ? { name: { in: [...ASSIGNABLE_ROLE_NAMES] } }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  countSuperAdmins(excludeUserId?: string) {
    return prisma.user.count({
      where: {
        deletedAt: null,
        role: { name: RoleName.super_admin },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    });
  }

  listPermissions() {
    return prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  }
}

export const usersRepository = new UsersRepository();
