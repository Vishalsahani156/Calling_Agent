'use client';

import { use } from 'react';

import { PermissionGuard } from '@/components/shared/permission-guard';
import { KnowledgeBaseDetailView } from '@/features/knowledge/components/KnowledgeBaseDetailView';

interface KnowledgeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function KnowledgeDetailPage({ params }: KnowledgeDetailPageProps) {
  const { id } = use(params);

  return (
    <PermissionGuard permission="knowledge:read">
      <KnowledgeBaseDetailView knowledgeBaseId={id} />
    </PermissionGuard>
  );
}
