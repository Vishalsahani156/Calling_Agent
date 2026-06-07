import { DocumentSourceType } from '@prisma/client';

export type CreateKnowledgeBaseInput = {
  name: string;
  description?: string;
  defaultLanguage?: string;
};

export type UpdateKnowledgeBaseInput = {
  name?: string;
  description?: string | null;
  defaultLanguage?: string;
};

export type CreateDocumentInput = {
  title: string;
  rawContent: string;
  sourceType?: DocumentSourceType;
  metadata?: Record<string, unknown>;
};

export type UpdateDocumentInput = {
  title?: string;
  rawContent?: string;
  metadata?: Record<string, unknown>;
};

export type CreateFaqInput = {
  question: string;
  answer: string;
  language?: string;
};

export type UpdateFaqInput = {
  question?: string;
  answer?: string;
  language?: string;
};

export type UploadDocumentInput = {
  title?: string;
  metadata?: Record<string, unknown>;
};

export type RetrievedChunk = {
  id: string;
  content: string;
  score: number;
  source: 'chunk' | 'faq';
};

export type FaqMatch = {
  id: string;
  question: string;
  answer: string;
  similarity: number;
};

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  faqMatch: FaqMatch | null;
  embeddingEnabled: boolean;
};

export type RetrieveQueryOptions = {
  topK?: number;
  faqThreshold?: number;
  language?: string;
};
