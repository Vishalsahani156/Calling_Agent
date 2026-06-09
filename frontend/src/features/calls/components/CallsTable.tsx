'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Eye, Search } from 'lucide-react';

import { TablePagination } from '@/components/shared/table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CallStatusBadge } from '@/features/calls/components/CallStatusBadge';
import { useCalls } from '@/features/calls/hooks/useCalls';
import { CALL_STATUSES, type CallStatus } from '@/features/calls/schemas';
import { formatContactName, formatDateTime, formatDuration } from '@/features/calls/utils/format';
import { apiGetPaginated } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

function toIsoDatetime(localValue: string): string | undefined {
  if (!localValue.trim()) return undefined;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function CallsTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'all'>('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [contactId, setContactId] = useState('');
  const [debouncedContactId, setDebouncedContactId] = useState('');
  const [fromLocal, setFromLocal] = useState('');
  const [toLocal, setToLocal] = useState('');

  const { data: campaignsData } = useQuery({
    queryKey: queryKeys.campaigns.list({ limit: '100' }),
    queryFn: () =>
      apiGetPaginated<{ id: string; name: string }>('/campaigns', { params: { limit: '100' } }),
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedContactId(contactId.trim()), 300);
    return () => clearTimeout(timer);
  }, [contactId]);

  const { data, isLoading, isError } = useCalls({
    page: String(page),
    limit: '20',
    status: statusFilter === 'all' ? undefined : statusFilter,
    campaignId: campaignFilter === 'all' ? undefined : campaignFilter,
    contactId: debouncedContactId || undefined,
    from: toIsoDatetime(fromLocal),
    to: toIsoDatetime(toLocal),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as CallStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CALL_STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Campaign</Label>
          <Select
            value={campaignFilter}
            onValueChange={(value) => {
              setCampaignFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {campaignsData?.data.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Contact ID</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="UUID filter"
              value={contactId}
              onChange={(event) => {
                setContactId(event.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>From</Label>
          <Input
            type="datetime-local"
            value={fromLocal}
            onChange={(event) => {
              setFromLocal(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <Input
            type="datetime-local"
            value={toLocal}
            onChange={(event) => {
              setToLocal(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 7 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-destructive">
                  Failed to load calls.
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No calls found.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((call) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatContactName(call.contact)}</p>
                      {call.contact ? (
                        <p className="text-sm text-muted-foreground">{call.contact.phone}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CallStatusBadge status={call.status} />
                  </TableCell>
                  <TableCell>{call.campaign?.name ?? '—'}</TableCell>
                  <TableCell>{call.aiAgent?.name ?? '—'}</TableCell>
                  <TableCell>{formatDateTime(call.startedAt)}</TableCell>
                  <TableCell>{formatDuration(call.durationSeconds)}</TableCell>
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
