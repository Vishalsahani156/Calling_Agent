import { z } from 'zod';

const phoneSchema = z.string().min(7).max(20);

export const createContactSchema = z.object({
  phone: phoneSchema,
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
  optOut: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(100)).optional(),
  groupIds: z.array(z.string().uuid()).optional(),
});

export const updateContactSchema = z.object({
  phone: phoneSchema.optional(),
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  optOut: z.boolean().optional(),
});

export const contactIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listContactsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  tagId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  optOut: z.enum(['true', 'false']).optional(),
});

export const exportContactsQuerySchema = z.object({
  search: z.string().optional(),
  tagId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  optOut: z.enum(['true', 'false']).optional(),
});

export const importContactsSchema = z.object({
  skipDuplicates: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value: boolean | 'true' | 'false' | undefined) => value === true || value === 'true'),
  groupId: z.string().uuid().optional(),
});

export const createNoteSchema = z.object({
  note: z.string().min(1),
});

export const createTagSchema = z.object({
  tags: z.array(z.string().min(1).max(100)).min(1),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const listGroupsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
