import { RequestHandler } from 'express';
import { ForbiddenError } from '../shared/errors/app.error';

export function requirePermission(resource: string, action: string): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    const key = `${resource}:${action}`;
    if (!req.user.permissions.includes(key)) {
      next(new ForbiddenError(`Missing permission: ${key}`));
      return;
    }

    next();
  };
}

export function requireAnyPermission(...permissions: Array<[string, string]>): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    const hasPermission = permissions.some(([resource, action]) =>
      req.user!.permissions.includes(`${resource}:${action}`),
    );

    if (!hasPermission) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}

export function requireRole(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.roleName)) {
      next(new ForbiddenError('Insufficient role'));
      return;
    }

    next();
  };
}
