'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createKnowledgeBase } from '@/features/knowledge/api/knowledge.api';
import type { CreateKnowledgeBaseInput } from '@/features/knowledge/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useCreateKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateKnowledgeBaseInput) => createKnowledgeBase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.lists() });
      toast.success('Knowledge base created');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
