import { z } from 'zod';

export const listKnowledgeBasesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  defaultLanguage: z.string().min(2).max(10).optional(),
});

export const updateKnowledgeBaseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  defaultLanguage: z.string().min(2).max(10).optional(),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(500),
  rawContent: z.string().min(1),
  sourceType: z.enum(['upload', 'url', 'faq', 'manual']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  rawContent: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  language: z.string().min(2).max(10).optional(),
});

export const updateFaqSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  language: z.string().min(2).max(10).optional(),
});

export const listDocumentsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const listFaqsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const uploadDocumentBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  metadata: z.string().optional(),
});

export type ListKnowledgeBasesQuery = z.infer<typeof listKnowledgeBasesQuerySchema>;
export type CreateKnowledgeBaseInput = z.infer<typeof createKnowledgeBaseSchema>;
export type UpdateKnowledgeBaseInput = z.infer<typeof updateKnowledgeBaseSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type ListFaqsQuery = z.infer<typeof listFaqsQuerySchema>;

export const SOURCE_TYPES = ['upload', 'url', 'faq', 'manual'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const DOCUMENT_STATUSES = ['processing', 'ready', 'failed'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
