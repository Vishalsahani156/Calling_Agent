'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchCall } from '@/features/calls/api/calls.api';
import { queryKeys } from '@/lib/query-keys';

export function useCall(id: string) {
  return useQuery({
    queryKey: queryKeys.calls.detail(id),
    queryFn: () => fetchCall(id),
    enabled: !!id,
  });
}
