'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchContact } from '@/features/contacts/api/contacts.api';
import { queryKeys } from '@/lib/query-keys';

export function useContact(id: string) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => fetchContact(id),
    enabled: !!id,
  });
}
