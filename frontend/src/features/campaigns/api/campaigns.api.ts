import { apiGetPaginated } from '@/lib/api-client';

export interface CampaignListItem {
  id: string;
  name: string;
}

function buildParams(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string>;
}

export async function fetchCampaigns(query: { page?: string; limit?: string; search?: string } = {}) {
  return apiGetPaginated<CampaignListItem>('/campaigns', { params: buildParams(query) });
}
