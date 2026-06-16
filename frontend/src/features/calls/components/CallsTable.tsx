'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Search } from 'lucide-react';

import { TablePagination } from '@/components/shared/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useCalls } from '@/features/calls/hooks/useCalls';
import type { CallStatus } from '@/features/calls/types';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function statusVariant(
  status: CallStatus,
): 'default' | 'secondary' | 'failed' | 'outline' | 'completed' | 'running' {
  switch (status) {
    case 'in_progress':
      return 'running';
    case 'ringing':
      return 'default';
    case 'completed':
      return 'completed';
    case 'failed':
    case 'busy':
    case 'no_answer':
    case 'canceled':
      return 'failed';
    default:
      return 'secondary';
  }
}

export function CallsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useCalls({
    page: String(page),
    limit: '20',
  });

  const filtered =
    data?.data.filter((call) => {
      if (!debouncedSearch) return true;
      const haystack = [
        call.contact?.phone,
        call.aiAgent?.name,
        call.campaign?.name,
        call.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(debouncedSearch.toLowerCase());
    }) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter calls..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-destructive">
                  Failed to load calls.
                </TableCell>
              </TableRow>
            ) : !filtered.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No calls yet. Use Test Voice Call on an agent or start a campaign.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((call) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <Badge variant={statusVariant(call.status)} className="capitalize">
                      {call.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{call.contact?.phone ?? 'Test call'}</TableCell>
                  <TableCell>{call.aiAgent?.name ?? '—'}</TableCell>
                  <TableCell>{call.campaign?.name ?? '—'}</TableCell>
                  <TableCell>{formatDate(call.startedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild aria-label="View call">
                      <Link href={`/calls/${call.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta ? <TablePagination meta={data.meta} onPageChange={setPage} /> : null}
    </div>
  );
}
