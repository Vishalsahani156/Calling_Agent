'use client';

import { use } from 'react';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { AgentDetailView } from '@/features/agents/components/AgentDetailView';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/lib/auth';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const canWrite = user ? hasPermission(user.permissions, 'agents:write') : false;
  const canTest = user ? hasPermission(user.permissions, 'agents:read') : false;
  const canCall = user ? hasPermission(user.permissions, 'calls:write') : false;

  return (
    <PermissionGuard permission="agents:read">
      <AgentDetailView agentId={id} canWrite={canWrite} canTest={canTest} canCall={canCall} />
    </PermissionGuard>
  );
}
