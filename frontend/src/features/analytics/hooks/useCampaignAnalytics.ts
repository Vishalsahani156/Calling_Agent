'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchCampaignAnalytics } from '@/features/analytics/api/analytics.api';
import { queryKeys } from '@/lib/query-keys';

export function useCampaignAnalytics(campaignId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics.campaign(campaignId),
    queryFn: () => fetchCampaignAnalytics(campaignId),
    enabled: enabled && !!campaignId,
  });
}
