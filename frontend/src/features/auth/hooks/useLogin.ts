'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { login } from '@/features/auth/api/auth.api';
import type { LoginInput } from '@/features/auth/schemas';
import { getAuthErrorMessage } from '@/features/auth/utils/errors';
import { setAccessToken } from '@/lib/auth';
import { queryKeys } from '@/lib/query-keys';

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(queryKeys.auth.me(), data.user);
      toast.success('Welcome back!');
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error));
    },
  });
}
