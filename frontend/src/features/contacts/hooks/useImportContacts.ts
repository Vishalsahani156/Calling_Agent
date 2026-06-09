'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { importContacts } from '@/features/contacts/api/contacts.api';
import type { ImportContactsInput } from '@/features/contacts/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useImportContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, options }: { file: File; options?: ImportContactsInput }) =>
      importContacts(file, options),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
      toast.success(data.message);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
