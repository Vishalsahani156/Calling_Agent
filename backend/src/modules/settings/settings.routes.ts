import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog, auditResponseHook } from '../../middleware/audit-log';
import { updateSettingsSchema } from './settings.validator';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('settings', 'read'), settingsController.get);

router.patch(
  '/',
  requirePermission('settings', 'write'),
  validate({ body: updateSettingsSchema }),
  auditLog({ action: 'update_settings', resourceType: 'settings' }),
  auditResponseHook,
  settingsController.update,
);

export default router;
