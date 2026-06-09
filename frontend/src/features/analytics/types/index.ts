export interface AnalyticsRollup {
  periodStart: string;
  periodEnd: string;
  metrics: unknown;
  updatedAt: string;
}

export interface AnalyticsOverview {
  campaigns: {
    total: number;
    running: number;
  };
  calls: {
    total: number;
    today: number;
    live: number;
    completed: number;
    completionRate: number;
  };
  generatedAt: string;
  lastRollup: AnalyticsRollup | null;
}

export interface CallStatusStats {
  count: number;
  avgDurationSeconds: number;
}

export interface CallAnalytics {
  period: {
    from: string;
    to: string;
  };
  campaignId: string | null;
  totals: {
    calls: number;
    completed: number;
    completionRate: number;
    avgDurationSeconds: number;
    totalDurationSeconds: number;
  };
  byStatus: Record<string, CallStatusStats>;
  daily: Array<{
    date: string;
    count: number;
  }>;
  generatedAt: string;
}

export interface CampaignAnalyticsCampaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface CampaignAnalytics {
  campaign: CampaignAnalyticsCampaign;
  calls: {
    total: number;
    completed: number;
    connectionRate: number;
    avgDurationSeconds: number;
    byStatus: Record<string, number>;
  };
  contacts: {
    total: number;
    completed: number;
    completionRate: number;
    byStatus: Record<string, number>;
  };
  generatedAt: string;
  lastRollup: AnalyticsRollup | null;
}
