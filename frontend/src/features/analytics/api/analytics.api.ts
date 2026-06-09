import { apiGet } from '@/lib/api-client';
import type { AnalyticsOverview } from '@/features/analytics/types';

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiGet<AnalyticsOverview>('/analytics/overview');
}
