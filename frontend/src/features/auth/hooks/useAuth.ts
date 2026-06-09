'use client';

import { useQuery } from '@tanstack/react-query';

import { getMe } from '@/features/auth/api/auth.api';
import { AUTH_SESSION_COOKIE } from '@/lib/constants';
import { getAccessToken } from '@/lib/auth';
import { queryKeys } from '@/lib/query-keys';

function hasAuthSession(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${AUTH_SESSION_COOKIE}=`));
}

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: getMe,
    enabled: !!getAccessToken() || hasAuthSession(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    isError,
  };
}
