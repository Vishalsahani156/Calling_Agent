'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/features/analytics/components/EmptyState';
import type { CallAnalytics } from '@/features/analytics/types';

interface DailyCallsChartProps {
  data?: CallAnalytics;
  isLoading?: boolean;
  isError?: boolean;
}

export function DailyCallsChart({ data, isLoading, isError }: DailyCallsChartProps) {
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
          <EmptyState title="Failed to load daily chart" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.daily.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily calls</CardTitle>
          <CardDescription>Call volume over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState title="No call data" description="Try expanding the date range or removing filters." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily calls</CardTitle>
        <CardDescription>Call volume over the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(label) => `Date: ${label}`} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
