import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog, auditResponseHook } from '../../middleware/audit-log';
import {
  createUserSchema,
  inviteUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from './users.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/roles',
  requirePermission('users', 'read'),
  usersController.listRoles,
);

router.get(
  '/permissions',
  requirePermission('users', 'read'),
  usersController.listPermissions,
);

router.get(
  '/',
  requirePermission('users', 'read'),
  validate({ query: listUsersQuerySchema }),
  usersController.list,
);

router.post(
  '/',
  requirePermission('users', 'write'),
  validate({ body: createUserSchema }),
  auditLog({ action: 'create_user', resourceType: 'user' }),
  auditResponseHook,
  usersController.create,
);

router.post(
  '/invite',
  requirePermission('users', 'write'),
  validate({ body: inviteUserSchema }),
  auditLog({ action: 'invite_user', resourceType: 'user' }),
  auditResponseHook,
  usersController.invite,
);

router.get(
  '/:id',
  requirePermission('users', 'read'),
  validate({ params: userIdParamSchema }),
  usersController.getById,
);

router.patch(
  '/:id',
  requirePermission('users', 'write'),
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  auditLog({
    action: 'update_user',
    resourceType: 'user',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  usersController.update,
);

router.delete(
  '/:id',
  requirePermission('users', 'delete'),
  validate({ params: userIdParamSchema }),
  auditLog({
    action: 'delete_user',
    resourceType: 'user',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  usersController.delete,
);

export default router;
