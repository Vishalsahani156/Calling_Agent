'use client';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { CampaignsTable } from '@/features/campaigns/components/CampaignsTable';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/lib/auth';

export function CampaignsPageContent() {
  const { user } = useAuth();
  const canWrite = user ? hasPermission(user.permissions, 'campaigns:write') : false;

  return (
    <PermissionGuard permission="campaigns:read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Create outbound calling campaigns, add contacts, and start dialing.
          </p>
        </div>
        <CampaignsTable canWrite={canWrite} />
      </div>
    </PermissionGuard>
  );
}
