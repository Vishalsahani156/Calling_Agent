'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Radio, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useLiveCalls } from '@/features/calls/hooks/useLiveCalls';
import { useLiveCallsWebSocket } from '@/features/calls/hooks/useLiveCallsWebSocket';
import type { CallSummary } from '@/features/calls/types';
import { formatContactName, formatDateTime, formatDuration } from '@/features/calls/utils/format';

type MonitorMode = 'websocket' | 'poll';

function LiveCallsTable({ calls }: { calls: CallSummary[] }) {
  if (!calls.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No active calls right now.</p>
    );
  }

  return (
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
        {calls.map((call) => (
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
        ))}
      </TableBody>
    </Table>
  );
}

export function LiveCallsPanel() {
  const [mode, setMode] = useState<MonitorMode>('websocket');
  const ws = useLiveCallsWebSocket(mode === 'websocket');
  const poll = useLiveCalls({ enabled: mode === 'poll', poll: true });

  const calls = mode === 'websocket' ? ws.calls : (poll.data?.calls ?? []);
  const count = mode === 'websocket' ? ws.count : (poll.data?.count ?? 0);
  const isLoading = mode === 'poll' && poll.isLoading;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Live calls
              <Badge variant="secondary">{count}</Badge>
            </CardTitle>
            <CardDescription>
              Monitor active calls in real time via WebSocket or polling fallback.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={mode === 'websocket' ? 'default' : 'outline'}
              onClick={() => setMode('websocket')}
            >
              WebSocket
              {mode === 'websocket' ? (
                <Badge variant={ws.connected ? 'running' : 'failed'} className="ml-2">
                  {ws.connected ? 'Connected' : 'Reconnecting'}
                </Badge>
              ) : null}
            </Button>
            <Button
              size="sm"
              variant={mode === 'poll' ? 'default' : 'outline'}
              onClick={() => setMode('poll')}
            >
              <RefreshCw className="h-4 w-4" />
              Poll (6s)
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <LiveCallsTable calls={calls} />
        )}
        {mode === 'websocket' && ws.lastEvent ? (
          <p className="mt-3 text-xs text-muted-foreground">Last event: {ws.lastEvent}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
