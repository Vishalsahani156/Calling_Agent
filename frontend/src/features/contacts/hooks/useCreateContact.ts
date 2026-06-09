'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createContact } from '@/features/contacts/api/contacts.api';
import type { CreateContactInput } from '@/features/contacts/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContactInput) => createContact(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
      toast.success('Contact created successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
