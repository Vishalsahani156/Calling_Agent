'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchSettings } from '@/features/settings/api/settings.api';
import { queryKeys } from '@/lib/query-keys';

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.current(),
    queryFn: fetchSettings,
  });
}
