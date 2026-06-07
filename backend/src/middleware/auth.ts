import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { UnauthorizedError } from '../shared/errors/app.error';
import { JwtAccessPayload } from '../types/jwt';

async function loadUserPermissions(roleId: string): Promise<string[]> {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });
  return rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`);
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice(7);
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
      throw new UnauthorizedError('User not found or inactive');
    }

    const permissions = await loadUserPermissions(user.roleId);

    req.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const optionalAuthenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  return authenticate(req, _res, next);
};
