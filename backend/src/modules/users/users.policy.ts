import { RoleName } from '@prisma/client';
import { ASSIGNABLE_ROLE_NAMES } from '../../shared/constants/platform';
import { BadRequestError, ForbiddenError } from '../../shared/errors/app.error';

export function assertSuperAdmin(requesterRole: string): void {
  if (requesterRole !== RoleName.super_admin) {
    throw new ForbiddenError('Only the super admin can manage users');
  }
}

export function assertAssignableRole(roleName: string): void {
  if (roleName === RoleName.super_admin) {
    throw new ForbiddenError('Super admin role cannot be assigned');
  }

  if (!ASSIGNABLE_ROLE_NAMES.includes(roleName as (typeof ASSIGNABLE_ROLE_NAMES)[number])) {
    throw new BadRequestError('Invalid role for assignment');
  }
}

export function assertCanModifyUser(targetRoleName: string): void {
  if (targetRoleName === RoleName.super_admin) {
    throw new ForbiddenError('Super admin account cannot be modified');
  }
}
