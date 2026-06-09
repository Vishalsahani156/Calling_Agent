'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchCallAnalytics } from '@/features/analytics/api/analytics.api';
import type { AnalyticsCallsQuery } from '@/features/analytics/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useCallAnalytics(query: AnalyticsCallsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.calls(query),
    queryFn: () => fetchCallAnalytics(query),
  });
}
