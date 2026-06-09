'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { forgotPassword } from '@/features/auth/api/auth.api';
import type { ForgotPasswordInput } from '@/features/auth/schemas';
import { getAuthErrorMessage } from '@/features/auth/utils/errors';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => forgotPassword(input),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error));
    },
  });
}
