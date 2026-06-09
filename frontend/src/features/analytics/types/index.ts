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
  lastRollup: {
    periodStart: string;
    periodEnd: string;
    metrics: unknown;
    updatedAt: string;
  } | null;
}
