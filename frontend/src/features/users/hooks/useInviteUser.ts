'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { inviteUser } from '@/features/users/api/users.api';
import type { InviteUserInput } from '@/features/users/schemas';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteUserInput) => inviteUser(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
