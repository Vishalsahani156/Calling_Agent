'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { KpiCard, KpiCardSkeleton } from '@/features/analytics/components/KpiCard';
import { EmptyState } from '@/features/analytics/components/EmptyState';
import { useAnalyticsOverview } from '@/features/analytics/hooks/useAnalyticsOverview';
import { formatNumber, formatPercent } from '@/features/analytics/utils/format';

export function OverviewKpiGrid() {
  const { data, isLoading, isError } = useAnalyticsOverview();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title="Unable to load overview" description="Check your connection and try again." />;
  }

  const kpis = [
    {
      label: 'Total campaigns',
      value: formatNumber(data.campaigns.total),
      description: `${formatNumber(data.campaigns.running)} running`,
    },
    {
      label: 'Total calls',
      value: formatNumber(data.calls.total),
      description: `${formatNumber(data.calls.today)} today`,
    },
    {
      label: 'Live calls',
      value: formatNumber(data.calls.live),
      description: 'Currently in progress',
    },
    {
      label: 'Completion rate',
      value: formatPercent(data.calls.completionRate),
      description: `${formatNumber(data.calls.completed)} completed`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} description={kpi.description} />
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href="/analytics">
            View charts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
