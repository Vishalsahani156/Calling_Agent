'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchCampaign } from '@/features/campaigns/api/campaigns.api';
import { queryKeys } from '@/lib/query-keys';

export function useCampaign(id: string) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: () => fetchCampaign(id),
    enabled: Boolean(id),
  });
}
