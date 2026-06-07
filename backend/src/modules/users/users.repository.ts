import { prisma } from '../../config/database';

export class UsersRepository {
  findMany(organizationId: string, skip: number, limit: number, search?: string) {
    return prisma.user.findMany({
      where: {
        organizationId,
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
      include: { role: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  count(organizationId: string, search?: string) {
    return prisma.user.count({
      where: {
        organizationId,
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

  findById(id: string, organizationId: string) {
    return prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { role: true },
    });
  }

  findByEmail(email: string) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
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
      include: { role: true },
    });
  }

  update(id: string, organizationId: string, data: Record<string, unknown>) {
    return prisma.user.update({
      where: { id, organizationId },
      data,
      include: { role: true },
    });
  }

  softDelete(id: string, organizationId: string) {
    return prisma.user.update({
      where: { id, organizationId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  listRoles() {
    return prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  listPermissions() {
    return prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  }
}

export const usersRepository = new UsersRepository();
