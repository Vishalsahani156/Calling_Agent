'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { updateContact } from '@/features/contacts/api/contacts.api';
import type { UpdateContactInput } from '@/features/contacts/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContactInput }) =>
      updateContact(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.contacts.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
      toast.success('Contact updated successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
