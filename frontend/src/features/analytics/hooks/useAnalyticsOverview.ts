'use client';

import { useQuery } from '@tanstack/react-query';

import { getAnalyticsOverview } from '@/features/analytics/api/analytics.api';
import { queryKeys } from '@/lib/query-keys';

export function useAnalyticsOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics.overview(),
    queryFn: getAnalyticsOverview,
    enabled,
    staleTime: 60 * 1000,
  });
}
