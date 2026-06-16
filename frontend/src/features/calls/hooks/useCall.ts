'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchCall } from '@/features/calls/api/calls.api';
import { queryKeys } from '@/lib/query-keys';

export function useCall(id: string) {
  return useQuery({
    queryKey: queryKeys.calls.detail(id),
    queryFn: () => fetchCall(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'initiated' || status === 'ringing' || status === 'in_progress') {
        return 3_000;
      }
      return false;
    },
  });
}
