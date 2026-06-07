import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../config/database';
import { JwtAccessPayload } from '../../types/jwt';

export interface AuthenticatedWsUser {
  id: string;
  email: string;
  organizationId: string;
  roleName: string;
  permissions: string[];
}

export async function authenticateWsToken(
  token: string | undefined,
): Promise<AuthenticatedWsUser | null> {
  if (!token?.trim()) {
    return null;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        isActive: true,
        deletedAt: null,
      },
      include: { role: true },
    });

    if (!user) {
      return null;
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: { permission: true },
    });

    const permissions = rolePermissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`,
    );

    if (!permissions.includes('calls:read')) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roleName: user.role.name,
      permissions,
    };
  } catch {
    return null;
  }
}
