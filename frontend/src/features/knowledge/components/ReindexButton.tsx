'use client';

import { Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useReindex } from '@/features/knowledge/hooks/useReindex';

interface ReindexButtonProps {
  knowledgeBaseId: string;
  canWrite: boolean;
}

export function ReindexButton({ knowledgeBaseId, canWrite }: ReindexButtonProps) {
  const reindexMutation = useReindex(knowledgeBaseId);

  if (!canWrite) return null;

  return (
    <Button
      variant="outline"
      onClick={() => reindexMutation.mutate()}
      disabled={reindexMutation.isPending}
    >
      {reindexMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {reindexMutation.isPending ? 'Reindexing...' : 'Reindex'}
    </Button>
  );
}
