import { z } from 'zod';

const jsonRecordSchema = z.record(z.unknown()).optional();

export const knowledgeBaseIdParamSchema = z.object({ id: z.string().uuid() });

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
});

export const faqIdParamSchema = z.object({
  id: z.string().uuid(),
  faqId: z.string().uuid(),
});

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
  metadata: jsonRecordSchema,
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  rawContent: z.string().min(1).optional(),
  metadata: jsonRecordSchema,
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

export const standaloneDocumentIdParamSchema = z.object({ id: z.string().uuid() });
