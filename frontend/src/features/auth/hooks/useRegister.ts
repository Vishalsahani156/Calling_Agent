'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { register } from '@/features/auth/api/auth.api';
import type { RegisterInput } from '@/features/auth/schemas';
import { getAuthErrorMessage } from '@/features/auth/utils/errors';
import { setAccessToken } from '@/lib/auth';
import { queryKeys } from '@/lib/query-keys';

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(queryKeys.auth.me(), data.user);
      toast.success('Account created successfully!');
      router.push('/');
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error));
    },
  });
}
