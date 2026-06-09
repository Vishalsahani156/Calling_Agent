'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchContacts } from '@/features/contacts/api/contacts.api';
import type { ListContactsQuery } from '@/features/contacts/schemas';
import { queryKeys } from '@/lib/query-keys';

export function useContacts(query: ListContactsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.contacts.list(query),
    queryFn: () => fetchContacts(query),
  });
}
