import type {
  CreateDocumentInput,
  CreateFaqInput,
  CreateKnowledgeBaseInput,
  DocumentStatus,
  ListDocumentsQuery,
  ListFaqsQuery,
  ListKnowledgeBasesQuery,
  SourceType,
  UpdateDocumentInput,
  UpdateFaqInput,
  UpdateKnowledgeBaseInput,
} from '@/features/knowledge/schemas';

export type {
  CreateKnowledgeBaseInput,
  UpdateKnowledgeBaseInput,
  CreateDocumentInput,
  UpdateDocumentInput,
  CreateFaqInput,
  UpdateFaqInput,
  ListKnowledgeBasesQuery,
  ListDocumentsQuery,
  ListFaqsQuery,
  SourceType,
  DocumentStatus,
};

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  defaultLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  title: string;
  sourceType: SourceType;
  rawContent: string | null;
  fileUrl: string | null;
  status: DocumentStatus;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: string;
  knowledgeBaseId: string;
  question: string;
  answer: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReindexResult {
  knowledgeBaseId: string;
  documentsProcessed: number;
  faqsProcessed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  embeddingEnabled: boolean;
  message: string;
}
