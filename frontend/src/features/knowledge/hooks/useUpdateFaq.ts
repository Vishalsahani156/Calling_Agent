'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { updateFaq } from '@/features/knowledge/api/knowledge.api';
import type { UpdateFaqInput } from '@/features/knowledge/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useUpdateFaq(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ faqId, input }: { faqId: string; input: UpdateFaqInput }) =>
      updateFaq(knowledgeBaseId, faqId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.faqs(knowledgeBaseId) });
      toast.success('FAQ updated');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
