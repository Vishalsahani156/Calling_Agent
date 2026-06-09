'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createFaq } from '@/features/knowledge/api/knowledge.api';
import type { CreateFaqInput } from '@/features/knowledge/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useCreateFaq(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFaqInput) => createFaq(knowledgeBaseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.faqs(knowledgeBaseId) });
      toast.success('FAQ created');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
