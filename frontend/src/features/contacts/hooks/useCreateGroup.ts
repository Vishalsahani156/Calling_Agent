'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createGroup } from '@/features/contacts/api/contacts.api';
import type { CreateGroupInput } from '@/features/contacts/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupInput) => createGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.groups() });
      toast.success('Group created successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
