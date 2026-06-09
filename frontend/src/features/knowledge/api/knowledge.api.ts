import {
  apiClient,
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  unwrapApiData,
} from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  CreateDocumentInput,
  CreateFaqInput,
  CreateKnowledgeBaseInput,
  ListDocumentsQuery,
  ListFaqsQuery,
  ListKnowledgeBasesQuery,
  UpdateFaqInput,
  UpdateKnowledgeBaseInput,
} from '@/features/knowledge/schemas';
import type { Faq, KnowledgeBase, KnowledgeDocument, ReindexResult } from '@/features/knowledge/types';

function buildParams(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string>;
}

export async function fetchKnowledgeBases(query: ListKnowledgeBasesQuery = {}) {
  return apiGetPaginated<KnowledgeBase>('/knowledge-bases', { params: buildParams(query) });
}

export async function fetchKnowledgeBase(id: string): Promise<KnowledgeBase> {
  return apiGet<KnowledgeBase>(`/knowledge-bases/${id}`);
}

export async function createKnowledgeBase(input: CreateKnowledgeBaseInput): Promise<KnowledgeBase> {
  return apiPost<KnowledgeBase, CreateKnowledgeBaseInput>('/knowledge-bases', input);
}

export async function updateKnowledgeBase(
  id: string,
  input: UpdateKnowledgeBaseInput,
): Promise<KnowledgeBase> {
  return apiPatch<KnowledgeBase, UpdateKnowledgeBaseInput>(`/knowledge-bases/${id}`, input);
}

export async function deleteKnowledgeBase(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/knowledge-bases/${id}`);
}

export async function fetchDocuments(knowledgeBaseId: string, query: ListDocumentsQuery = {}) {
  return apiGetPaginated<KnowledgeDocument>(`/knowledge-bases/${knowledgeBaseId}/documents`, {
    params: buildParams(query),
  });
}

export async function createDocument(
  knowledgeBaseId: string,
  input: CreateDocumentInput,
): Promise<KnowledgeDocument> {
  return apiPost<KnowledgeDocument, CreateDocumentInput>(
    `/knowledge-bases/${knowledgeBaseId}/documents`,
    input,
  );
}

export async function uploadDocument(
  knowledgeBaseId: string,
  file: File,
  options: { title?: string; metadata?: Record<string, unknown> } = {},
): Promise<KnowledgeDocument> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.title) {
    formData.append('title', options.title);
  }
  if (options.metadata) {
    formData.append('metadata', JSON.stringify(options.metadata));
  }
  const response = await apiClient.post<ApiResponse<KnowledgeDocument>>(
    `/knowledge-bases/${knowledgeBaseId}/documents/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrapApiData(response);
}

export async function deleteDocument(documentId: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/knowledge-documents/${documentId}`);
}

export async function fetchFaqs(knowledgeBaseId: string, query: ListFaqsQuery = {}) {
  return apiGetPaginated<Faq>(`/knowledge-bases/${knowledgeBaseId}/faqs`, {
    params: buildParams(query),
  });
}

export async function createFaq(knowledgeBaseId: string, input: CreateFaqInput): Promise<Faq> {
  return apiPost<Faq, CreateFaqInput>(`/knowledge-bases/${knowledgeBaseId}/faqs`, input);
}

export async function updateFaq(
  knowledgeBaseId: string,
  faqId: string,
  input: UpdateFaqInput,
): Promise<Faq> {
  return apiPatch<Faq, UpdateFaqInput>(`/knowledge-bases/${knowledgeBaseId}/faqs/${faqId}`, input);
}

export async function deleteFaq(
  knowledgeBaseId: string,
  faqId: string,
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/knowledge-bases/${knowledgeBaseId}/faqs/${faqId}`);
}

export async function reindexKnowledgeBase(knowledgeBaseId: string): Promise<ReindexResult> {
  return apiPost<ReindexResult>(`/knowledge-bases/${knowledgeBaseId}/reindex`);
}
