'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deleteDocument } from '@/features/knowledge/api/knowledge.api';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useDeleteDocument(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.documents(knowledgeBaseId) });
      toast.success(data.message);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
