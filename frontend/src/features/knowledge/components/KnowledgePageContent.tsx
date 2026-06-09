'use client';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { KnowledgeBaseList } from '@/features/knowledge/components/KnowledgeBaseList';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission } from '@/lib/auth';

export function KnowledgePageContent() {
  const { user } = useAuth();
  const canWrite = user ? hasPermission(user.permissions, 'knowledge:write') : false;

  return (
    <PermissionGuard permission="knowledge:read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Bases</h1>
          <p className="text-sm text-muted-foreground">
            Manage documents and FAQs for AI voice agent retrieval.
          </p>
        </div>
        <KnowledgeBaseList canWrite={canWrite} />
      </div>
    </PermissionGuard>
  );
}
