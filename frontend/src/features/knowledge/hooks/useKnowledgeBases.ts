'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchKnowledgeBases } from '@/features/knowledge/api/knowledge.api';
import type { ListKnowledgeBasesQuery } from '@/features/knowledge/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useKnowledgeBases(query: ListKnowledgeBasesQuery = {}) {
  return useQuery({
    queryKey: queryKeys.knowledge.list(query),
    queryFn: () => fetchKnowledgeBases(query),
  });
}
