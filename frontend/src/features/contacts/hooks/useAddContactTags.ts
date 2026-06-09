'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { addContactTags } from '@/features/contacts/api/contacts.api';
import type { CreateTagInput } from '@/features/contacts/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useAddContactTags(contactId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTagInput) => addContactTags(contactId, input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.contacts.detail(contactId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
      toast.success('Tags added successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
