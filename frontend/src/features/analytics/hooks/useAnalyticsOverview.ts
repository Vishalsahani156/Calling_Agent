'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchAnalyticsOverview } from '@/features/analytics/api/analytics.api';
import { queryKeys } from '@/lib/query-keys';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: queryKeys.analytics.overview(),
    queryFn: () => fetchAnalyticsOverview(),
  });
}
