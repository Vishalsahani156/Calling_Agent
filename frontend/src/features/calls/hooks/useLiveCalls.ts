'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchLiveCalls } from '@/features/calls/api/calls.api';
import { queryKeys } from '@/lib/query-keys';

const POLL_INTERVAL_MS = 6_000;

interface UseLiveCallsOptions {
  enabled?: boolean;
  poll?: boolean;
}

export function useLiveCalls({ enabled = true, poll = true }: UseLiveCallsOptions = {}) {
  return useQuery({
    queryKey: queryKeys.calls.live(),
    queryFn: () => fetchLiveCalls(),
    enabled,
    refetchInterval: poll ? POLL_INTERVAL_MS : false,
  });
}
