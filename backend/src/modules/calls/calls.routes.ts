import { Router } from 'express';
import { callsController } from './calls.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { callIdParamSchema, listCallsQuerySchema } from './calls.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('calls', 'read'),
  validate({ query: listCallsQuerySchema }),
  callsController.list,
);

router.get('/live', requirePermission('calls', 'read'), callsController.getLive);

router.get(
  '/:id',
  requirePermission('calls', 'read'),
  validate({ params: callIdParamSchema }),
  callsController.getById,
);

router.get(
  '/:id/transcript',
  requirePermission('calls', 'read'),
  validate({ params: callIdParamSchema }),
  callsController.getTranscript,
);

router.get(
  '/:id/recording',
  requirePermission('calls', 'read'),
  validate({ params: callIdParamSchema }),
  callsController.getRecording,
);

export default router;
