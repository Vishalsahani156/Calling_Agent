import { RoleName } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  organizationId: string;
  roleId: string;
  roleName: RoleName;
  permissions: string[];
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  organizationId: string;
  roleId: string;
  roleName: RoleName;
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthUser;
      auditAction?: string;
      auditResourceType?: string;
      auditResourceId?: string;
    }
  }
}

export {};
