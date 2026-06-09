'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { reindexKnowledgeBase } from '@/features/knowledge/api/knowledge.api';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useReindex(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reindexKnowledgeBase(knowledgeBaseId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.documents(knowledgeBaseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.faqs(knowledgeBaseId) });
      toast.success(data.message);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
