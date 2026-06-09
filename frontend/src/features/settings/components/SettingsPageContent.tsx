'use client';

import { SettingsForm } from '@/features/settings/components/SettingsForm';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/components/shared/permission-guard';
import { hasPermission } from '@/lib/auth';

export function SettingsPageContent() {
  const { user } = useAuth();
  const canWrite = user ? hasPermission(user.permissions, 'settings:write') : false;

  return (
    <PermissionGuard permission="settings:read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage telephony, notifications, and organization preferences.
          </p>
        </div>
        <SettingsForm canWrite={canWrite} />
      </div>
    </PermissionGuard>
  );
}
