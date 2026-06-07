import { Router } from 'express';
import { campaignsController } from './campaigns.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog, auditResponseHook } from '../../middleware/audit-log';
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdParamSchema,
  listCampaignsQuerySchema,
  importContactsSchema,
} from './campaigns.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('campaigns', 'read'),
  validate({ query: listCampaignsQuerySchema }),
  campaignsController.list,
);

router.post(
  '/',
  requirePermission('campaigns', 'write'),
  validate({ body: createCampaignSchema }),
  auditLog({ action: 'create_campaign', resourceType: 'campaign' }),
  auditResponseHook,
  campaignsController.create,
);

router.get(
  '/:id',
  requirePermission('campaigns', 'read'),
  validate({ params: campaignIdParamSchema }),
  campaignsController.getById,
);

router.patch(
  '/:id',
  requirePermission('campaigns', 'write'),
  validate({ params: campaignIdParamSchema, body: updateCampaignSchema }),
  auditLog({
    action: 'update_campaign',
    resourceType: 'campaign',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  campaignsController.update,
);

router.delete(
  '/:id',
  requirePermission('campaigns', 'delete'),
  validate({ params: campaignIdParamSchema }),
  auditLog({
    action: 'delete_campaign',
    resourceType: 'campaign',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  campaignsController.delete,
);

router.post(
  '/:id/contacts/import',
  requirePermission('campaigns', 'write'),
  validate({ params: campaignIdParamSchema, body: importContactsSchema }),
  auditLog({
    action: 'import_campaign_contacts',
    resourceType: 'campaign',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  campaignsController.importContacts,
);

router.post(
  '/:id/start',
  requirePermission('campaigns', 'write'),
  validate({ params: campaignIdParamSchema }),
  auditLog({
    action: 'start_campaign',
    resourceType: 'campaign',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  campaignsController.start,
);

router.post(
  '/:id/pause',
  requirePermission('campaigns', 'write'),
  validate({ params: campaignIdParamSchema }),
  auditLog({
    action: 'pause_campaign',
    resourceType: 'campaign',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  campaignsController.pause,
);

router.post(
  '/:id/stop',
  requirePermission('campaigns', 'write'),
  validate({ params: campaignIdParamSchema }),
  auditLog({
    action: 'stop_campaign',
    resourceType: 'campaign',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  campaignsController.stop,
);

router.get(
  '/:id/analytics',
  requirePermission('campaigns', 'read'),
  validate({ params: campaignIdParamSchema }),
  campaignsController.getAnalytics,
);

router.get(
  '/:id/report',
  requirePermission('campaigns', 'read'),
  validate({ params: campaignIdParamSchema }),
  campaignsController.getReport,
);

export default router;
