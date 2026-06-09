'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { Button } from '@/components/ui/button';
import { LiveCallsPanel } from '@/features/calls/components/LiveCallsPanel';

export function LiveCallsPageContent() {
  return (
    <PermissionGuard permission="calls:read">
      <div className="space-y-6">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link href="/calls">
              <ArrowLeft className="h-4 w-4" />
              Back to call history
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Live Call Monitor</h1>
            <p className="text-sm text-muted-foreground">
              Real-time view of initiated, ringing, and in-progress calls.
            </p>
          </div>
        </div>
        <LiveCallsPanel />
      </div>
    </PermissionGuard>
  );
}
