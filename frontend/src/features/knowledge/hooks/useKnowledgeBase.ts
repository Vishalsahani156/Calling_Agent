'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchKnowledgeBase } from '@/features/knowledge/api/knowledge.api';
import { queryKeys } from '@/lib/query-keys';

export function useKnowledgeBase(id: string) {
  return useQuery({
    queryKey: queryKeys.knowledge.detail(id),
    queryFn: () => fetchKnowledgeBase(id),
    enabled: !!id,
  });
}
