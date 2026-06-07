import { Router } from 'express';
import { agentsController } from './agents.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog, auditResponseHook } from '../../middleware/audit-log';
import {
  createAgentSchema,
  updateAgentSchema,
  agentIdParamSchema,
  listAgentsQuerySchema,
  testAgentSchema,
} from './agents.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('agents', 'read'),
  validate({ query: listAgentsQuerySchema }),
  agentsController.list,
);

router.post(
  '/',
  requirePermission('agents', 'write'),
  validate({ body: createAgentSchema }),
  auditLog({ action: 'create_agent', resourceType: 'ai_agent' }),
  auditResponseHook,
  agentsController.create,
);

router.get(
  '/:id',
  requirePermission('agents', 'read'),
  validate({ params: agentIdParamSchema }),
  agentsController.getById,
);

router.patch(
  '/:id',
  requirePermission('agents', 'write'),
  validate({ params: agentIdParamSchema, body: updateAgentSchema }),
  auditLog({
    action: 'update_agent',
    resourceType: 'ai_agent',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  agentsController.update,
);

router.delete(
  '/:id',
  requirePermission('agents', 'delete'),
  validate({ params: agentIdParamSchema }),
  auditLog({
    action: 'delete_agent',
    resourceType: 'ai_agent',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  agentsController.delete,
);

router.post(
  '/:id/test',
  requirePermission('agents', 'read'),
  validate({ params: agentIdParamSchema, body: testAgentSchema }),
  agentsController.test,
);

export default router;
