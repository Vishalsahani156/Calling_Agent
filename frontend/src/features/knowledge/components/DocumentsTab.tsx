'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

import { TablePagination } from '@/components/shared/table-pagination';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateManualDocumentDialog } from '@/features/knowledge/components/CreateManualDocumentDialog';
import { DocumentStatusBadge, SourceTypeBadge } from '@/features/knowledge/components/status-badges';
import { UploadDocumentDialog } from '@/features/knowledge/components/UploadDocumentDialog';
import { useDeleteDocument } from '@/features/knowledge/hooks/useDeleteDocument';
import { useDocuments } from '@/features/knowledge/hooks/useDocuments';
import type { KnowledgeDocument } from '@/features/knowledge/types';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface DocumentsTabProps {
  knowledgeBaseId: string;
  canWrite: boolean;
  canDelete: boolean;
}

export function DocumentsTab({ knowledgeBaseId, canWrite, canDelete }: DocumentsTabProps) {
  const [page, setPage] = useState(1);
  const [deletingDoc, setDeletingDoc] = useState<KnowledgeDocument | null>(null);

  const { data, isLoading, isError } = useDocuments(knowledgeBaseId, {
    page: String(page),
    limit: '20',
  });
  const deleteMutation = useDeleteDocument(knowledgeBaseId);

  function handleDeleteConfirm() {
    if (!deletingDoc) return;
    deleteMutation.mutate(deletingDoc.id, {
      onSuccess: () => setDeletingDoc(null),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <UploadDocumentDialog knowledgeBaseId={knowledgeBaseId} canWrite={canWrite} />
        <CreateManualDocumentDialog knowledgeBaseId={knowledgeBaseId} canWrite={canWrite} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              {canDelete ? <TableHead className="text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: canDelete ? 5 : 4 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={canDelete ? 5 : 4} className="h-24 text-center text-destructive">
                  Failed to load documents.
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell
                  colSpan={canDelete ? 5 : 4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No documents yet. Upload a file or add text content.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>
                    <SourceTypeBadge sourceType={doc.sourceType} />
                  </TableCell>
                  <TableCell>
                    <DocumentStatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell>{formatDate(doc.updatedAt)}</TableCell>
                  {canDelete ? (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${doc.title}`}
                        onClick={() => setDeletingDoc(doc)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta ? <TablePagination meta={data.meta} onPageChange={setPage} /> : null}

      <Dialog open={!!deletingDoc} onOpenChange={(open) => !open && setDeletingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              Delete <strong>{deletingDoc?.title}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDoc(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
