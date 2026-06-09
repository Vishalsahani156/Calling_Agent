'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createDocument } from '@/features/knowledge/api/knowledge.api';
import type { CreateDocumentInput } from '@/features/knowledge/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useCreateDocument(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDocumentInput) => createDocument(knowledgeBaseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.documents(knowledgeBaseId) });
      toast.success('Document created');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
