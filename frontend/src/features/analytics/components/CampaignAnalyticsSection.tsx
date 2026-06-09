'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/features/analytics/components/EmptyState';
import { KpiCard, KpiCardSkeleton } from '@/features/analytics/components/KpiCard';
import { useCampaignAnalytics } from '@/features/analytics/hooks/useCampaignAnalytics';
import {
  formatDurationSeconds,
  formatNumber,
  formatPercent,
  formatStatusLabel,
} from '@/features/analytics/utils/format';

interface CampaignAnalyticsSectionProps {
  campaignId: string;
}

function StatusBreakdownCard({
  title,
  byStatus,
}: {
  title: string;
  byStatus: Record<string, number>;
}) {
  const chartData = Object.entries(byStatus).map(([status, count]) => ({
    status: formatStatusLabel(status),
    count,
  }));

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="No data yet" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignAnalyticsSection({ campaignId }: CampaignAnalyticsSectionProps) {
  const { data, isLoading, isError } = useCampaignAnalytics(campaignId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <KpiCardSkeleton key={index} />
          ))}
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title="Unable to load campaign analytics" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Performance metrics for {data.campaign.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total calls"
          value={formatNumber(data.calls.total)}
          description={`${formatNumber(data.calls.completed)} completed`}
        />
        <KpiCard label="Connection rate" value={formatPercent(data.calls.connectionRate)} />
        <KpiCard
          label="Avg call duration"
          value={formatDurationSeconds(data.calls.avgDurationSeconds)}
        />
        <KpiCard
          label="Contact completion"
          value={formatPercent(data.contacts.completionRate)}
          description={`${formatNumber(data.contacts.completed)} / ${formatNumber(data.contacts.total)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusBreakdownCard title="Calls by status" byStatus={data.calls.byStatus} />
        <StatusBreakdownCard title="Contacts by status" byStatus={data.contacts.byStatus} />
      </div>
    </div>
  );
}
