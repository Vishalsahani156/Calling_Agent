import { RoleName } from '@prisma/client';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  organizationId: string;
  roleId: string;
  roleName: RoleName;
}

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
}
