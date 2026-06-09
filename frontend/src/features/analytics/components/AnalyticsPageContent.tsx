'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CallAnalyticsSummary } from '@/features/analytics/components/CallAnalyticsSummary';
import { CallsByStatusChart } from '@/features/analytics/components/CallsByStatusChart';
import { DailyCallsChart } from '@/features/analytics/components/DailyCallsChart';
import { DateRangeFilter } from '@/features/analytics/components/DateRangeFilter';
import { useCallAnalytics } from '@/features/analytics/hooks/useCallAnalytics';
import { defaultDateRange, toIsoDatetime } from '@/features/analytics/utils/format';
import { fetchCampaigns } from '@/features/campaigns/api/campaigns.api';
import { queryKeys } from '@/lib/query-keys';

export function AnalyticsPageContent() {
  const defaults = defaultDateRange();
  const [fromLocal, setFromLocal] = useState(defaults.fromLocal);
  const [toLocal, setToLocal] = useState(defaults.toLocal);
  const [campaignId, setCampaignId] = useState('all');

  const { data: campaignsData } = useQuery({
    queryKey: queryKeys.campaigns.list({ limit: '100' }),
    queryFn: () => fetchCampaigns({ limit: '100' }),
  });

  const query = {
    from: toIsoDatetime(fromLocal),
    to: toIsoDatetime(toLocal),
    campaignId: campaignId === 'all' ? undefined : campaignId,
  };

  const { data, isLoading, isError } = useCallAnalytics(query);

  return (
    <PermissionGuard permission="analytics:read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Call volume, completion rates, and status breakdowns over time.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DateRangeFilter
              fromLocal={fromLocal}
              toLocal={toLocal}
              onFromChange={setFromLocal}
              onToChange={setToLocal}
            />
          </div>
          <div className="space-y-2">
            <Label>Campaign</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="All campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {campaignsData?.data.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <CallAnalyticsSummary data={data} isLoading={isLoading} isError={isError} />
        <div className="grid gap-6 lg:grid-cols-2">
          <DailyCallsChart data={data} isLoading={isLoading} isError={isError} />
          <CallsByStatusChart data={data} isLoading={isLoading} isError={isError} />
        </div>
      </div>
    </PermissionGuard>
  );
}
