import { prisma } from '../../config/database';
import { RoleName } from '@prisma/client';

export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true, organization: true },
    });
  }

  findUserById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null, isActive: true },
      include: { role: true, organization: true },
    });
  }

  findRoleByName(name: RoleName) {
    return prisma.role.findUnique({ where: { name } });
  }

  findOrganizationBySlug(slug: string) {
    return prisma.organization.findUnique({ where: { slug } });
  }

  createOrganizationWithUser(data: {
    orgName: string;
    slug: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.orgName,
          slug: data.slug,
        },
      });

      await tx.settings.create({
        data: { organizationId: organization.id },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          organizationId: organization.id,
          roleId: data.roleId,
          emailVerifiedAt: new Date(),
        },
        include: { role: true, organization: true },
      });

      return user;
    });
  }

  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: { role: true, organization: true } } },
    });
  }

  revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  findPasswordResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  }

  markPasswordResetUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  getUserPermissions(roleId: string) {
    return prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
  }
}

export const authRepository = new AuthRepository();
