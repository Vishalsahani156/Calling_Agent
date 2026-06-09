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
import type { CallAnalytics } from '@/features/analytics/types';
import { formatStatusLabel } from '@/features/analytics/utils/format';

interface CallsByStatusChartProps {
  data?: CallAnalytics;
  isLoading?: boolean;
  isError?: boolean;
}

export function CallsByStatusChart({ data, isLoading, isError }: CallsByStatusChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState title="Failed to load status chart" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    ? Object.entries(data.byStatus).map(([status, stats]) => ({
        status: formatStatusLabel(status),
        count: stats.count,
      }))
    : [];

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calls by status</CardTitle>
          <CardDescription>Distribution across call outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState title="No status breakdown" description="No calls match the current filters." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calls by status</CardTitle>
        <CardDescription>Distribution across call outcomes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="status" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
