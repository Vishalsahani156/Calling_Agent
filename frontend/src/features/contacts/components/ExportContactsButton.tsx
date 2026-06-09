'use client';

import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useExportContacts } from '@/features/contacts/hooks/useExportContacts';
import type { ExportContactsQuery } from '@/features/contacts/schemas';

interface ExportContactsButtonProps {
  filters: ExportContactsQuery;
  canRead: boolean;
}

export function ExportContactsButton({ filters, canRead }: ExportContactsButtonProps) {
  const exportMutation = useExportContacts();

  if (!canRead) return null;

  return (
    <Button
      variant="outline"
      onClick={() => exportMutation.mutate(filters)}
      disabled={exportMutation.isPending}
    >
      {exportMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}
