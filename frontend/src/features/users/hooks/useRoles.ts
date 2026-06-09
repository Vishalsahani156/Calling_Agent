'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchRoles } from '@/features/users/api/users.api';
import { queryKeys } from '@/lib/query-keys';

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.users.roles(),
    queryFn: fetchRoles,
    staleTime: 10 * 60 * 1000,
  });
}
