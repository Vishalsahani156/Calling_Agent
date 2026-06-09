'use client';

import Link from 'next/link';
import { Radio } from 'lucide-react';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { Button } from '@/components/ui/button';
import { CallsTable } from '@/features/calls/components/CallsTable';

export function CallsPageContent() {
  return (
    <PermissionGuard permission="calls:read">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Call History</h1>
            <p className="text-sm text-muted-foreground">
              Browse completed and in-progress calls with transcripts and recordings.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/calls/live">
              <Radio className="h-4 w-4" />
              Live monitor
            </Link>
          </Button>
        </div>
        <CallsTable />
      </div>
    </PermissionGuard>
  );
}
