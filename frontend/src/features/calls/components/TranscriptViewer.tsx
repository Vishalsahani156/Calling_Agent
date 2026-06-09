'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { CallTranscriptEntry } from '@/features/calls/types';
import { formatMs } from '@/features/calls/utils/format';
import { cn } from '@/lib/utils';

interface TranscriptViewerProps {
  transcripts: CallTranscriptEntry[];
  isLoading?: boolean;
  isError?: boolean;
}

function speakerLabel(speaker: string): string {
  return speaker.replace(/_/g, ' ');
}

export function TranscriptViewer({ transcripts, isLoading, isError }: TranscriptViewerProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load transcript.</p>;
  }

  if (!transcripts.length) {
    return <p className="text-sm text-muted-foreground">No transcript available for this call.</p>;
  }

  return (
    <div className="max-h-[32rem] space-y-3 overflow-y-auto rounded-md border p-4">
      {transcripts.map((entry) => {
        const isAgent = entry.speaker.toLowerCase().includes('agent');
        return (
          <div
            key={entry.id}
            className={cn(
              'rounded-md px-3 py-2 text-sm',
              isAgent ? 'mr-8 bg-muted' : 'ml-8 bg-primary/10',
            )}
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium capitalize">{speakerLabel(entry.speaker)}</span>
              <span>
                {formatMs(entry.startMs)}
                {entry.confidence !== null ? ` · ${Math.round(entry.confidence * 100)}%` : ''}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{entry.text}</p>
          </div>
        );
      })}
    </div>
  );
}
