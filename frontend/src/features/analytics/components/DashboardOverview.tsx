'use client';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { OverviewKpiGrid } from '@/features/analytics/components/OverviewKpiGrid';

export function DashboardOverview() {
  return (
    <PermissionGuard permission="analytics:read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Organization-wide campaign and call performance at a glance.
          </p>
        </div>
        <OverviewKpiGrid />
      </div>
    </PermissionGuard>
  );
}
