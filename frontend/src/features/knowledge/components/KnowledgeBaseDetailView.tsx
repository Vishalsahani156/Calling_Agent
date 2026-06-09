'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentsTab } from '@/features/knowledge/components/DocumentsTab';
import { FaqsTab } from '@/features/knowledge/components/FaqsTab';
import { ReindexButton } from '@/features/knowledge/components/ReindexButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useKnowledgeBase } from '@/features/knowledge/hooks/useKnowledgeBase';
import { hasPermission } from '@/lib/auth';
import { cn } from '@/lib/utils';

type Tab = 'documents' | 'faqs';

interface KnowledgeBaseDetailViewProps {
  knowledgeBaseId: string;
}

export function KnowledgeBaseDetailView({ knowledgeBaseId }: KnowledgeBaseDetailViewProps) {
  const [tab, setTab] = useState<Tab>('documents');
  const { user } = useAuth();
  const { data: kb, isLoading, isError } = useKnowledgeBase(knowledgeBaseId);

  const canWrite = user ? hasPermission(user.permissions, 'knowledge:write') : false;
  const canDelete = user ? hasPermission(user.permissions, 'knowledge:delete') : false;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !kb) {
    return <p className="text-destructive">Knowledge base not found or failed to load.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link href="/knowledge">
              <ArrowLeft className="h-4 w-4" />
              Back to knowledge bases
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{kb.name}</h1>
          {kb.description ? (
            <p className="text-sm text-muted-foreground">{kb.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">Default language: {kb.defaultLanguage}</p>
        </div>
        <ReindexButton knowledgeBaseId={knowledgeBaseId} canWrite={canWrite} />
      </div>

      <div className="flex gap-2 border-b">
        {(['documents', 'faqs'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors',
              tab === value
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {tab === 'documents' ? (
        <DocumentsTab
          knowledgeBaseId={knowledgeBaseId}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      ) : (
        <FaqsTab
          knowledgeBaseId={knowledgeBaseId}
          defaultLanguage={kb.defaultLanguage}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}
