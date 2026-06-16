'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2, Pause, Play, Plus, Search, Square } from 'lucide-react';

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
import { CampaignFormDialog } from '@/features/campaigns/components/CampaignFormDialog';
import { useCampaignAction } from '@/features/campaigns/hooks/useCampaignAction';
import { useCampaigns } from '@/features/campaigns/hooks/useCampaigns';
import type { CampaignStatus } from '@/features/campaigns/types';
import { cn } from '@/lib/utils';

function statusVariant(status: CampaignStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'running':
      return 'default';
    case 'paused':
      return 'secondary';
    case 'stopped':
    case 'completed':
      return 'outline';
    default:
      return 'secondary';
  }
}

interface CampaignsTableProps {
  canWrite: boolean;
}

export function CampaignsTable({ canWrite }: CampaignsTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const actionMutation = useCampaignAction();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useCampaigns({
    page: String(page),
    limit: '20',
    search: debouncedSearch || undefined,
  });

  function handleAction(id: string, action: 'start' | 'pause' | 'stop') {
    actionMutation.mutate({ id, action });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        {canWrite ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New campaign
          </Button>
        ) : null}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Calls</TableHead>
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
                  Failed to load campaigns.
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No campaigns yet. Create one to start outbound calling.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(campaign.status)} className="capitalize">
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.aiAgent.name}</TableCell>
                  <TableCell>{campaign.contactCount}</TableCell>
                  <TableCell>{campaign.callCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild aria-label="View campaign">
                        <Link href={`/campaigns/${campaign.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {canWrite && ['draft', 'scheduled', 'paused', 'stopped'].includes(campaign.status) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Start campaign"
                          disabled={actionMutation.isPending}
                          onClick={() => handleAction(campaign.id, 'start')}
                        >
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : null}
                      {canWrite && campaign.status === 'running' ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Pause campaign"
                            disabled={actionMutation.isPending}
                            onClick={() => handleAction(campaign.id, 'pause')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Stop campaign"
                            disabled={actionMutation.isPending}
                            onClick={() => handleAction(campaign.id, 'stop')}
                          >
                            <Square className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
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

      <CampaignFormDialog open={createOpen} onOpenChange={setCreateOpen} canWrite={canWrite} />
    </div>
  );
}
