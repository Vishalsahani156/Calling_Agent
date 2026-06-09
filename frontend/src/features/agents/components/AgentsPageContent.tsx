'use client';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { AgentsTable } from '@/features/agents/components/AgentsTable';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/lib/auth';

export function AgentsPageContent() {
  const { user } = useAuth();
  const canWrite = user ? hasPermission(user.permissions, 'agents:write') : false;
  const canDelete = user ? hasPermission(user.permissions, 'agents:delete') : false;

  return (
    <PermissionGuard permission="agents:read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
          <p className="text-sm text-muted-foreground">
            Configure voice agents with personality, LLM settings, and sandbox testing.
          </p>
        </div>
        <AgentsTable canWrite={canWrite} canDelete={canDelete} />
      </div>
    </PermissionGuard>
  );
}
