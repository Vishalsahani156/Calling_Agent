'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { addContactNote } from '@/features/contacts/api/contacts.api';
import type { CreateNoteInput } from '@/features/contacts/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useAddContactNote(contactId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => addContactNote(contactId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(contactId) });
      toast.success('Note added successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
