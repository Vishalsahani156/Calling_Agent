'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { resetPassword } from '@/features/auth/api/auth.api';
import type { ResetPasswordInput } from '@/features/auth/schemas';
import { getAuthErrorMessage } from '@/features/auth/utils/errors';

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ResetPasswordInput) => resetPassword(input),
    onSuccess: (data) => {
      toast.success(data.message);
      router.push('/login');
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error));
    },
  });
}
