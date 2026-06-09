'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { uploadDocument } from '@/features/knowledge/api/knowledge.api';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useUploadDocument(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      title,
      metadata,
    }: {
      file: File;
      title?: string;
      metadata?: Record<string, unknown>;
    }) => uploadDocument(knowledgeBaseId, file, { title, metadata }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.documents(knowledgeBaseId) });
      toast.success('Document uploaded');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
