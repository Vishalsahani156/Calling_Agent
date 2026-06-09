'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchCallTranscript } from '@/features/calls/api/calls.api';
import { queryKeys } from '@/lib/query-keys';

export function useCallTranscript(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.calls.transcript(id),
    queryFn: () => fetchCallTranscript(id),
    enabled: enabled && !!id,
  });
}
