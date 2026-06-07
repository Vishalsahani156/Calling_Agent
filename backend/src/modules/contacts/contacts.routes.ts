import { Router } from 'express';
import multer from 'multer';
import { contactsController } from './contacts.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { auditLog, auditResponseHook } from '../../middleware/audit-log';
import {
  createContactSchema,
  updateContactSchema,
  contactIdParamSchema,
  listContactsQuerySchema,
  exportContactsQuerySchema,
  importContactsSchema,
  createNoteSchema,
  createTagSchema,
  createGroupSchema,
  listGroupsQuerySchema,
} from './contacts.validator';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only CSV files are allowed'));
  },
});

const contactsRouter = Router();
const groupsRouter = Router();

contactsRouter.use(authenticate);
groupsRouter.use(authenticate);

contactsRouter.get(
  '/',
  requirePermission('contacts', 'read'),
  validate({ query: listContactsQuerySchema }),
  contactsController.list,
);

contactsRouter.post(
  '/',
  requirePermission('contacts', 'write'),
  validate({ body: createContactSchema }),
  auditLog({ action: 'create_contact', resourceType: 'contact' }),
  auditResponseHook,
  contactsController.create,
);

contactsRouter.post(
  '/import',
  requirePermission('contacts', 'write'),
  upload.single('file'),
  validate({ body: importContactsSchema }),
  auditLog({ action: 'import_contacts', resourceType: 'contact' }),
  auditResponseHook,
  contactsController.import,
);

contactsRouter.get(
  '/export',
  requirePermission('contacts', 'read'),
  validate({ query: exportContactsQuerySchema }),
  contactsController.export,
);

contactsRouter.get(
  '/:id',
  requirePermission('contacts', 'read'),
  validate({ params: contactIdParamSchema }),
  contactsController.getById,
);

contactsRouter.patch(
  '/:id',
  requirePermission('contacts', 'write'),
  validate({ params: contactIdParamSchema, body: updateContactSchema }),
  auditLog({
    action: 'update_contact',
    resourceType: 'contact',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  contactsController.update,
);

contactsRouter.delete(
  '/:id',
  requirePermission('contacts', 'delete'),
  validate({ params: contactIdParamSchema }),
  auditLog({
    action: 'delete_contact',
    resourceType: 'contact',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  contactsController.delete,
);

contactsRouter.post(
  '/:id/tags',
  requirePermission('contacts', 'write'),
  validate({ params: contactIdParamSchema, body: createTagSchema }),
  auditLog({
    action: 'add_contact_tags',
    resourceType: 'contact',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  contactsController.addTags,
);

contactsRouter.post(
  '/:id/notes',
  requirePermission('contacts', 'write'),
  validate({ params: contactIdParamSchema, body: createNoteSchema }),
  auditLog({
    action: 'add_contact_note',
    resourceType: 'contact',
    getResourceId: (req) => req.params.id,
  }),
  auditResponseHook,
  contactsController.addNote,
);

groupsRouter.get(
  '/',
  requirePermission('contacts', 'read'),
  validate({ query: listGroupsQuerySchema }),
  contactsController.listGroups,
);

groupsRouter.post(
  '/',
  requirePermission('contacts', 'write'),
  validate({ body: createGroupSchema }),
  auditLog({ action: 'create_contact_group', resourceType: 'contact_group' }),
  auditResponseHook,
  contactsController.createGroup,
);

export { groupsRouter };
export default contactsRouter;
