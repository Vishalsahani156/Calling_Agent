'use client';

import { use } from 'react';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { CallDetailView } from '@/features/calls/components/CallDetailView';

interface CallDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CallDetailPage({ params }: CallDetailPageProps) {
  const { id } = use(params);

  return (
    <PermissionGuard permission="calls:read">
      <CallDetailView callId={id} />
    </PermissionGuard>
  );
}
