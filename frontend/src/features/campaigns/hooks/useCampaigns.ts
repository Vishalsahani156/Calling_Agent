'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchCampaigns } from '@/features/campaigns/api/campaigns.api';
import type { ListCampaignsQuery } from '@/features/campaigns/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useCampaigns(query: ListCampaignsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.campaigns.list(query),
    queryFn: () => fetchCampaigns(query),
  });
}
