'use client';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { CallsTable } from '@/features/calls/components/CallsTable';

export function CallsPageContent() {
  return (
    <PermissionGuard permission="calls:read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calls</h1>
          <p className="text-sm text-muted-foreground">
            View call history, status, and transcripts from campaigns and test calls.
          </p>
        </div>
        <CallsTable />
      </div>
    </PermissionGuard>
  );
}
