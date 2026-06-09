'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchDocuments } from '@/features/knowledge/api/knowledge.api';
import type { ListDocumentsQuery } from '@/features/knowledge/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useDocuments(knowledgeBaseId: string, query: ListDocumentsQuery = {}) {
  return useQuery({
    queryKey: [...queryKeys.knowledge.documents(knowledgeBaseId), query],
    queryFn: () => fetchDocuments(knowledgeBaseId, query),
    enabled: !!knowledgeBaseId,
  });
}
