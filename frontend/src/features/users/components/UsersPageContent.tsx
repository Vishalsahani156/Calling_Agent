'use client';

import { UsersTable } from '@/features/users/components/UsersTable';
import { PermissionGuard } from '@/components/shared/permission-guard';

export function UsersPageContent() {
  return (
    <PermissionGuard permission="users:read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Super admin can view all registered users, assign roles, and delete accounts.
          </p>
        </div>
        <UsersTable />
      </div>
    </PermissionGuard>
  );
}
