'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CallStatusBadge } from '@/features/calls/components/CallStatusBadge';
import { RecordingPlayer } from '@/features/calls/components/RecordingPlayer';
import { TranscriptViewer } from '@/features/calls/components/TranscriptViewer';
import { useCall } from '@/features/calls/hooks/useCall';
import { useCallRecording } from '@/features/calls/hooks/useCallRecording';
import { useCallTranscript } from '@/features/calls/hooks/useCallTranscript';
import {
  formatContactName,
  formatDateTime,
  formatDuration,
} from '@/features/calls/utils/format';

interface CallDetailViewProps {
  callId: string;
}

export function CallDetailView({ callId }: CallDetailViewProps) {
  const { data: call, isLoading, isError } = useCall(callId);
  const {
    data: transcriptData,
    isLoading: transcriptLoading,
    isError: transcriptError,
  } = useCallTranscript(callId);
  const {
    data: recordingData,
    isLoading: recordingLoading,
    isError: recordingError,
  } = useCallRecording(callId, call?.hasRecording ?? false);

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

  const transcripts = transcriptData?.transcripts ?? call.transcripts ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link href="/calls">
            <ArrowLeft className="h-4 w-4" />
            Back to call history
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Call details</h1>
          <CallStatusBadge status={call.status} />
          {call.leadQualified ? <Badge variant="running">Lead qualified</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {formatContactName(call.contact)}
          {call.contact ? ` · ${call.contact.phone}` : ''}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Direction</span>
              <span className="font-medium capitalize">{call.direction}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Started</span>
              <span className="font-medium">{formatDateTime(call.startedAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Answered</span>
              <span className="font-medium">{formatDateTime(call.answeredAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ended</span>
              <span className="font-medium">{formatDateTime(call.endedAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{formatDuration(call.durationSeconds)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Disposition</span>
              <span className="font-medium capitalize">{call.disposition?.replace(/_/g, ' ') ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Language</span>
              <span className="font-medium">{call.languageDetected ?? '—'}</span>
            </div>
            {call.sentiment ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Sentiment</span>
                <span className="font-medium capitalize">{call.sentiment}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Contact</span>
              {call.contact ? (
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href={`/contacts/${call.contact.id}`}>
                    {formatContactName(call.contact)}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              ) : (
                <span className="font-medium">—</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Campaign</span>
              {call.campaign ? (
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href={`/campaigns/${call.campaign.id}`}>
                    {call.campaign.name}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              ) : (
                <span className="font-medium">—</span>
              )}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">AI agent</span>
              <span className="font-medium">{call.aiAgent?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Exotel SID</span>
              <span className="font-mono text-xs">{call.exotelCallSid ?? '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {call.summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{call.summary}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordingPlayer
            recording={recordingData?.recording}
            isLoading={recordingLoading}
            isError={recordingError}
            hasRecording={call.hasRecording}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <TranscriptViewer
            transcripts={transcripts}
            isLoading={transcriptLoading}
            isError={transcriptError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
