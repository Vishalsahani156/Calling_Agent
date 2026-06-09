'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchContacts } from '@/features/contacts/api/contacts.api';
import type { ContactTag } from '@/features/contacts/types';

export function useContactTagOptions() {
  return useQuery({
    queryKey: ['contacts', 'tag-options'],
    queryFn: async () => {
      const result = await fetchContacts({ limit: '100' });
      const tagMap = new Map<string, ContactTag>();
      result.data.forEach((contact) => {
        contact.tags.forEach((tag) => tagMap.set(tag.id, tag));
      });
      return [...tagMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 5 * 60 * 1000,
  });
}
