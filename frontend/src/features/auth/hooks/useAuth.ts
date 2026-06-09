'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getMe } from '@/features/auth/api/auth.api';
import { AUTH_SESSION_COOKIE } from '@/lib/constants';
import { getAccessToken } from '@/lib/auth';
import { queryKeys } from '@/lib/query-keys';

function hasAuthSession(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${AUTH_SESSION_COOKIE}=`));
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: getMe,
    enabled: !!getAccessToken() || hasAuthSession(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
    isError,
    error,
    refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() }),
    setUser: (nextUser: NonNullable<typeof user>) => {
      queryClient.setQueryData(queryKeys.auth.me(), nextUser);
    },
    clearUser: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
    },
  };
}
