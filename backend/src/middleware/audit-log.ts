import { Prisma } from '@prisma/client';
import { Request, RequestHandler } from 'express';
import { prisma } from '../config/database';
import { eventBus, AppEvents } from '../events/event-bus';

interface AuditOptions {
  action: string;
  resourceType: string;
  getResourceId?: (req: Request) => string | undefined;
}

export function auditLog(options: AuditOptions): RequestHandler {
  return (req, _res, next) => {
    req.auditAction = options.action;
    req.auditResourceType = options.resourceType;
    if (options.getResourceId) {
      req.auditResourceId = options.getResourceId(req);
    }
    next();
  };
}

export async function persistAuditLog(
  req: Request,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!req.user || !req.auditAction || !req.auditResourceType) return;

  const auditData = {
    organizationId: req.user.organizationId,
    userId: req.user.id,
    action: req.auditAction,
    resourceType: req.auditResourceType,
    resourceId: req.auditResourceId ?? null,
    ipAddress: req.ip || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] ?? null,
    metadata: (metadata ?? {}) as Prisma.InputJsonValue,
  };

  await prisma.auditLog.create({ data: auditData });

  eventBus.emit(AppEvents.AUDIT_LOGGED, {
    ...auditData,
    requestId: req.requestId,
  });
}

export const auditResponseHook: RequestHandler = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function auditJson(body: unknown) {
    if (req.user && req.auditAction && res.statusCode >= 200 && res.statusCode < 300) {
      void persistAuditLog(req, {
        statusCode: res.statusCode,
        requestId: req.requestId,
      }).catch(console.error);
    }
    return originalJson(body);
  };

  next();
};
