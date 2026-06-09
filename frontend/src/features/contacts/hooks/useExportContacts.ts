'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { exportContacts } from '@/features/contacts/api/contacts.api';
import type { ExportContactsQuery } from '@/features/contacts/schemas';
import { getErrorMessage } from '@/lib/errors';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useExportContacts() {
  return useMutation({
    mutationFn: (query: ExportContactsQuery) => exportContacts(query),
    onSuccess: (blob) => {
      downloadBlob(blob, 'contacts.csv');
      toast.success('Contacts exported successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
