import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  analyticsCallsQuerySchema,
  campaignAnalyticsParamSchema,
} from './analytics.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/overview',
  requirePermission('analytics', 'read'),
  analyticsController.getOverview,
);

router.get(
  '/calls',
  requirePermission('analytics', 'read'),
  validate({ query: analyticsCallsQuerySchema }),
  analyticsController.getCallStats,
);

router.get(
  '/campaigns/:id',
  requirePermission('analytics', 'read'),
  validate({ params: campaignAnalyticsParamSchema }),
  analyticsController.getCampaignStats,
);

export default router;
