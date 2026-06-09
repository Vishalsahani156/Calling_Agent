import { apiGet } from '@/lib/api-client';
import type { AnalyticsCallsQuery } from '@/features/analytics/schemas';
import type {
  AnalyticsOverview,
  CallAnalytics,
  CampaignAnalytics,
} from '@/features/analytics/types';

function buildParams(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string>;
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiGet<AnalyticsOverview>('/analytics/overview');
}

export async function fetchCallAnalytics(query: AnalyticsCallsQuery = {}): Promise<CallAnalytics> {
  return apiGet<CallAnalytics>('/analytics/calls', { params: buildParams(query) });
}

export async function fetchCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
  return apiGet<CampaignAnalytics>(`/analytics/campaigns/${campaignId}`);
}
