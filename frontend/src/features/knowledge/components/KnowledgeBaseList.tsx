'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Search } from 'lucide-react';

import { TablePagination } from '@/components/shared/table-pagination';
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
import { CreateKnowledgeBaseDialog } from '@/features/knowledge/components/CreateKnowledgeBaseDialog';
import { useKnowledgeBases } from '@/features/knowledge/hooks/useKnowledgeBases';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface KnowledgeBaseListProps {
  canWrite: boolean;
}

export function KnowledgeBaseList({ canWrite }: KnowledgeBaseListProps) {
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

  const { data, isLoading, isError } = useKnowledgeBases({
    page: String(page),
    limit: '20',
    search: debouncedSearch || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search knowledge bases..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <CreateKnowledgeBaseDialog canWrite={canWrite} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 4 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-destructive">
                  Failed to load knowledge bases.
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No knowledge bases found.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((kb) => (
                <TableRow key={kb.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{kb.name}</p>
                      {kb.description ? (
                        <p className="text-sm text-muted-foreground line-clamp-1">{kb.description}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{kb.defaultLanguage}</TableCell>
                  <TableCell>{formatDate(kb.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild aria-label={`View ${kb.name}`}>
                      <Link href={`/knowledge/${kb.id}`}>
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
