'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/lib/auth';
import { PermissionDenied } from '@/components/shared/permission-denied';
import { Skeleton } from '@/components/ui/skeleton';

interface PermissionGuardProps {
  permission: `${string}:${string}`;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback,
  loading,
}: PermissionGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      loading ?? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      )
    );
  }

  if (!user || !hasPermission(user.permissions, permission)) {
    return fallback ?? <PermissionDenied />;
  }

  return children;
}
