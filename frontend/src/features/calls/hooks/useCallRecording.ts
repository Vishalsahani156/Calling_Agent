'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchCallRecording } from '@/features/calls/api/calls.api';
import { queryKeys } from '@/lib/query-keys';

export function useCallRecording(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.calls.recording(id),
    queryFn: () => fetchCallRecording(id),
    enabled: enabled && !!id,
    retry: false,
  });
}
