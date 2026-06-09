'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchGroups } from '@/features/contacts/api/contacts.api';
import type { ListGroupsQuery } from '@/features/contacts/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useGroups(query: ListGroupsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.contacts.groupsList(query),
    queryFn: () => fetchGroups(query),
  });
}
