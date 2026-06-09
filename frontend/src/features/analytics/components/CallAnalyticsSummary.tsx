'use client';

import { EmptyState } from '@/features/analytics/components/EmptyState';
import { KpiCard, KpiCardSkeleton } from '@/features/analytics/components/KpiCard';
import type { CallAnalytics } from '@/features/analytics/types';
import {
  formatDurationSeconds,
  formatNumber,
  formatPercent,
} from '@/features/analytics/utils/format';

interface CallAnalyticsSummaryProps {
  data?: CallAnalytics;
  isLoading?: boolean;
  isError?: boolean;
}

export function CallAnalyticsSummary({ data, isLoading, isError }: CallAnalyticsSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title="Unable to load call analytics" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Total calls" value={formatNumber(data.totals.calls)} />
      <KpiCard label="Completed" value={formatNumber(data.totals.completed)} />
      <KpiCard label="Completion rate" value={formatPercent(data.totals.completionRate)} />
      <KpiCard
        label="Avg duration"
        value={formatDurationSeconds(data.totals.avgDurationSeconds)}
        description={`${formatDurationSeconds(data.totals.totalDurationSeconds)} total`}
      />
    </div>
  );
}
