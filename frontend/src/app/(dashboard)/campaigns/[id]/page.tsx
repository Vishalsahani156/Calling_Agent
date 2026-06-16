'use client';

import { use } from 'react';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { CampaignDetailView } from '@/features/campaigns/components/CampaignDetailView';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/lib/auth';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const canWrite = user ? hasPermission(user.permissions, 'campaigns:write') : false;

  return (
    <PermissionGuard permission="campaigns:read">
      <CampaignDetailView campaignId={id} canWrite={canWrite} />
    </PermissionGuard>
  );
}
