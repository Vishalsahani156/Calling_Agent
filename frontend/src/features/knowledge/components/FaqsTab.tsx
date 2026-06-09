'use client';

import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

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
import { FaqFormDialog } from '@/features/knowledge/components/FaqFormDialog';
import { useDeleteFaq } from '@/features/knowledge/hooks/useDeleteFaq';
import { useFaqs } from '@/features/knowledge/hooks/useFaqs';
import type { Faq } from '@/features/knowledge/types';

interface FaqsTabProps {
  knowledgeBaseId: string;
  defaultLanguage: string;
  canWrite: boolean;
  canDelete: boolean;
}

export function FaqsTab({
  knowledgeBaseId,
  defaultLanguage,
  canWrite,
  canDelete,
}: FaqsTabProps) {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<Faq | null>(null);

  const { data, isLoading, isError } = useFaqs(knowledgeBaseId, {
    page: String(page),
    limit: '20',
  });
  const deleteMutation = useDeleteFaq(knowledgeBaseId);

  function handleDeleteConfirm() {
    if (!deletingFaq) return;
    deleteMutation.mutate(deletingFaq.id, {
      onSuccess: () => setDeletingFaq(null),
    });
  }

  return (
    <div className="space-y-4">
      {canWrite ? (
        <Button
          onClick={() => {
            setEditingFaq(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add FAQ
        </Button>
      ) : null}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Language</TableHead>
              {(canWrite || canDelete) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: canWrite || canDelete ? 3 : 2 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={canWrite || canDelete ? 3 : 2}
                  className="h-24 text-center text-destructive"
                >
                  Failed to load FAQs.
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell
                  colSpan={canWrite || canDelete ? 3 : 2}
                  className="h-24 text-center text-muted-foreground"
                >
                  No FAQs yet.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{faq.question}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                    </div>
                  </TableCell>
                  <TableCell>{faq.language}</TableCell>
                  {(canWrite || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canWrite ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit FAQ"
                            onClick={() => {
                              setEditingFaq(faq);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete FAQ"
                            onClick={() => setDeletingFaq(faq)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta ? <TablePagination meta={data.meta} onPageChange={setPage} /> : null}

      <FaqFormDialog
        knowledgeBaseId={knowledgeBaseId}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingFaq(null);
        }}
        faq={editingFaq}
        defaultLanguage={defaultLanguage}
      />

      <Dialog open={!!deletingFaq} onOpenChange={(open) => !open && setDeletingFaq(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete FAQ</DialogTitle>
            <DialogDescription>
              Delete this FAQ? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingFaq(null)}>
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
