'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchUsers } from '@/features/users/api/users.api';
import type { ListUsersQuery } from '@/features/users/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useUsers(query: ListUsersQuery = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => fetchUsers(query),
  });
}
