import { Router } from 'express';
import multer from 'multer';
import { knowledgeController } from './knowledge.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog, auditResponseHook } from '../../middleware/audit-log';
import { env } from '../../config/env';
import {
  createDocumentSchema,
  createFaqSchema,
  createKnowledgeBaseSchema,
  documentIdParamSchema,
  faqIdParamSchema,
  knowledgeBaseIdParamSchema,
  listDocumentsQuerySchema,
  listFaqsQuerySchema,
  listKnowledgeBasesQuerySchema,
  standaloneDocumentIdParamSchema,
  updateDocumentSchema,
  updateFaqSchema,
  updateKnowledgeBaseSchema,
} from './knowledge.validator';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

const router = Router();
const documentRouter = Router();

router.use(authenticate);
documentRouter.use(authenticate);

router.get(
  '/',
  requirePermission('knowledge', 'read'),
  validate({ query: listKnowledgeBasesQuerySchema }),
  knowledgeController.listKnowledgeBases,
);

router.post(
  '/',
  requirePermission('knowledge', 'write'),
  validate({ body: createKnowledgeBaseSchema }),
  auditLog({ action: 'create_knowledge_base', resourceType: 'knowledge_base' }),
  auditResponseHook,
  knowledgeController.createKnowledgeBase,
);

router.get(
  '/:id',
  requirePermission('knowledge', 'read'),
  validate({ params: knowledgeBaseIdParamSchema }),
  knowledgeController.getKnowledgeBaseById,
);

router.patch(
  '/:id',
  requirePermission('knowledge', 'write'),
  validate({ params: knowledgeBaseIdParamSchema, body: updateKnowledgeBaseSchema }),
  auditLog({
    action: 'update_knowledge_base',
    resourceType: 'knowledge_base',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  knowledgeController.updateKnowledgeBase,
);

router.delete(
  '/:id',
  requirePermission('knowledge', 'delete'),
  validate({ params: knowledgeBaseIdParamSchema }),
  auditLog({
    action: 'delete_knowledge_base',
    resourceType: 'knowledge_base',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  knowledgeController.deleteKnowledgeBase,
);

router.get(
  '/:id/documents',
  requirePermission('knowledge', 'read'),
  validate({ params: knowledgeBaseIdParamSchema, query: listDocumentsQuerySchema }),
  knowledgeController.listDocuments,
);

router.post(
  '/:id/documents',
  requirePermission('knowledge', 'write'),
  validate({ params: knowledgeBaseIdParamSchema, body: createDocumentSchema }),
  auditLog({
    action: 'create_knowledge_document',
    resourceType: 'knowledge_document',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  knowledgeController.createDocument,
);

router.post(
  '/:id/documents/upload',
  requirePermission('knowledge', 'write'),
  validate({ params: knowledgeBaseIdParamSchema }),
  upload.single('file'),
  auditLog({
    action: 'upload_knowledge_document',
    resourceType: 'knowledge_document',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  knowledgeController.uploadDocument,
);

router.get(
  '/:id/documents/:documentId',
  requirePermission('knowledge', 'read'),
  validate({ params: documentIdParamSchema }),
  knowledgeController.getDocumentById,
);

router.patch(
  '/:id/documents/:documentId',
  requirePermission('knowledge', 'write'),
  validate({ params: documentIdParamSchema, body: updateDocumentSchema }),
  auditLog({
    action: 'update_knowledge_document',
    resourceType: 'knowledge_document',
    getResourceId: (req) => req.params.documentId,
  }),
  auditResponseHook,
  knowledgeController.updateDocument,
);

router.delete(
  '/:id/documents/:documentId',
  requirePermission('knowledge', 'delete'),
  validate({ params: documentIdParamSchema }),
  auditLog({
    action: 'delete_knowledge_document',
    resourceType: 'knowledge_document',
    getResourceId: (req) => req.params.documentId,
  }),
  auditResponseHook,
  knowledgeController.deleteDocument,
);

router.get(
  '/:id/faqs',
  requirePermission('knowledge', 'read'),
  validate({ params: knowledgeBaseIdParamSchema, query: listFaqsQuerySchema }),
  knowledgeController.listFaqs,
);

router.post(
  '/:id/faqs',
  requirePermission('knowledge', 'write'),
  validate({ params: knowledgeBaseIdParamSchema, body: createFaqSchema }),
  auditLog({
    action: 'create_faq',
    resourceType: 'faq',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  knowledgeController.createFaq,
);

router.get(
  '/:id/faqs/:faqId',
  requirePermission('knowledge', 'read'),
  validate({ params: faqIdParamSchema }),
  knowledgeController.getFaqById,
);

router.patch(
  '/:id/faqs/:faqId',
  requirePermission('knowledge', 'write'),
  validate({ params: faqIdParamSchema, body: updateFaqSchema }),
  auditLog({
    action: 'update_faq',
    resourceType: 'faq',
    getResourceId: (req) => req.params.faqId,
  }),
  auditResponseHook,
  knowledgeController.updateFaq,
);

router.delete(
  '/:id/faqs/:faqId',
  requirePermission('knowledge', 'delete'),
  validate({ params: faqIdParamSchema }),
  auditLog({
    action: 'delete_faq',
    resourceType: 'faq',
    getResourceId: (req) => req.params.faqId,
  }),
  auditResponseHook,
  knowledgeController.deleteFaq,
);

router.post(
  '/:id/reindex',
  requirePermission('knowledge', 'write'),
  validate({ params: knowledgeBaseIdParamSchema }),
  auditLog({
    action: 'reindex_knowledge_base',
    resourceType: 'knowledge_base',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  knowledgeController.reindex,
);

documentRouter.delete(
  '/:id',
  requirePermission('knowledge', 'delete'),
  validate({ params: standaloneDocumentIdParamSchema }),
  auditLog({
    action: 'delete_knowledge_document',
    resourceType: 'knowledge_document',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  knowledgeController.deleteDocumentById,
);

export { documentRouter };
export default router;
