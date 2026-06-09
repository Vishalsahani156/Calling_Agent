'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchAgent } from '@/features/agents/api/agents.api';
import { queryKeys } from '@/lib/query-keys';

export function useAgent(id: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(id),
    queryFn: () => fetchAgent(id),
    enabled: !!id,
  });
}
