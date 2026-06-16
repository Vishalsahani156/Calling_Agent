'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchCalls } from '@/features/calls/api/calls.api';
import type { ListCallsQuery } from '@/features/calls/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useCalls(query: ListCallsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.calls.list(query),
    queryFn: () => fetchCalls(query),
  });
}
