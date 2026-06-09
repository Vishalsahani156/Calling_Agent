'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AgentFormDialog } from '@/features/agents/components/AgentFormDialog';
import { useDeleteAgent } from '@/features/agents/hooks/useDeleteAgent';
import { useAgents } from '@/features/agents/hooks/useAgents';
import type { Agent } from '@/features/agents/types';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface AgentsTableProps {
  canWrite: boolean;
  canDelete: boolean;
}

export function AgentsTable({ canWrite, canDelete }: AgentsTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);

  const deleteMutation = useDeleteAgent();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useAgents({
    page: String(page),
    limit: '20',
    search: debouncedSearch || undefined,
  });

  function handleDeleteConfirm() {
    if (!deletingAgent) return;
    deleteMutation.mutate(deletingAgent.id, {
      onSuccess: () => setDeletingAgent(null),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        {canWrite ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New agent
          </Button>
        ) : null}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Interruption</TableHead>
              <TableHead>Max silence</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 5 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-destructive">
                  Failed to load agents.
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No agents found.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.interruptionEnabled ? 'On' : 'Off'}</TableCell>
                  <TableCell>{agent.maxSilenceSeconds}s</TableCell>
                  <TableCell>{formatDate(agent.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild aria-label={`View ${agent.name}`}>
                        <Link href={`/agents/${agent.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {canWrite ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${agent.name}`}
                          onClick={() => setEditingAgent(agent)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${agent.name}`}
                          onClick={() => setDeletingAgent(agent)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta ? <TablePagination meta={data.meta} onPageChange={setPage} /> : null}

      <AgentFormDialog open={createOpen} onOpenChange={setCreateOpen} canWrite={canWrite} />
      <AgentFormDialog
        agent={editingAgent}
        open={!!editingAgent}
        onOpenChange={(open) => !open && setEditingAgent(null)}
        canWrite={canWrite}
      />

      <Dialog open={!!deletingAgent} onOpenChange={(open) => !open && setDeletingAgent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingAgent?.name}&quot;? This cannot be
              undone if the agent is used by campaigns.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAgent(null)}>
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
