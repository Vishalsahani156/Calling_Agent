'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deleteContact } from '@/features/contacts/api/contacts.api';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
      toast.success(data.message);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
