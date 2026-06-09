'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchFaqs } from '@/features/knowledge/api/knowledge.api';
import type { ListFaqsQuery } from '@/features/knowledge/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useFaqs(knowledgeBaseId: string, query: ListFaqsQuery = {}) {
  return useQuery({
    queryKey: [...queryKeys.knowledge.faqs(knowledgeBaseId), query],
    queryFn: () => fetchFaqs(knowledgeBaseId, query),
    enabled: !!knowledgeBaseId,
  });
}
