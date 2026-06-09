'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchAgents } from '@/features/agents/api/agents.api';
import type { ListAgentsQuery } from '@/features/agents/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useAgents(query: ListAgentsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.agents.list(query),
    queryFn: () => fetchAgents(query),
  });
}
