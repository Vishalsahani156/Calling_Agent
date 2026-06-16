'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCall } from '@/features/calls/hooks/useCall';

interface CallDetailViewProps {
  callId: string;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function CallDetailView({ callId }: CallDetailViewProps) {
  const { data: call, isLoading, isError } = useCall(callId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !call) {
    return <p className="text-destructive">Call not found or failed to load.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link href="/calls">
            <ArrowLeft className="h-4 w-4" />
            Back to calls
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Call details</h1>
          <Badge className="capitalize">{call.status.replace('_', ' ')}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Agent:</span> {call.aiAgent?.name ?? '—'}
            </p>
            <p>
              <span className="font-medium">Contact:</span> {call.contact?.phone ?? 'Test call'}
            </p>
            <p>
              <span className="font-medium">Campaign:</span> {call.campaign?.name ?? '—'}
            </p>
            <p>
              <span className="font-medium">Started:</span> {formatDate(call.startedAt)}
            </p>
            <p>
              <span className="font-medium">Answered:</span> {formatDate(call.answeredAt)}
            </p>
            <p>
              <span className="font-medium">Ended:</span> {formatDate(call.endedAt)}
            </p>
            <p>
              <span className="font-medium">Duration:</span>{' '}
              {call.durationSeconds != null ? `${call.durationSeconds}s` : '—'}
            </p>
            {call.summary ? (
              <div className="pt-2">
                <p className="mb-1 font-medium">Post-call summary</p>
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-muted-foreground">
                  {call.summary}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            {call.transcripts.length ? (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {call.transcripts.map((entry) => (
                  <div key={entry.id} className="rounded-md bg-muted p-3 text-sm">
                    <p className="mb-1 text-xs font-medium capitalize text-muted-foreground">
                      {entry.speaker}
                    </p>
                    <p className="whitespace-pre-wrap">{entry.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No transcript yet. Transcripts appear after the call connects and the voice server
                is running.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
