'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { logout } from '@/features/auth/api/auth.api';
import { getAuthErrorMessage } from '@/features/auth/utils/errors';
import { clearAccessToken } from '@/lib/auth';
import { queryKeys } from '@/lib/query-keys';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAccessToken();
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      toast.success('Logged out successfully');
      router.push('/login');
    },
    onError: (error) => {
      clearAccessToken();
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      toast.error(getAuthErrorMessage(error));
      router.push('/login');
    },
  });
}
