'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { CallRecording } from '@/features/calls/types';
import { formatDuration } from '@/features/calls/utils/format';

interface RecordingPlayerProps {
  recording?: CallRecording;
  isLoading?: boolean;
  isError?: boolean;
  hasRecording?: boolean;
}

export function RecordingPlayer({
  recording,
  isLoading,
  isError,
  hasRecording,
}: RecordingPlayerProps) {
  if (isLoading) {
    return <Skeleton className="h-12 w-full" />;
  }

  if (!hasRecording) {
    return <p className="text-sm text-muted-foreground">No recording for this call.</p>;
  }

  if (isError || !recording?.url) {
    return <p className="text-sm text-destructive">Recording unavailable.</p>;
  }

  return (
    <div className="space-y-2 rounded-md border p-4">
      <audio controls className="w-full" src={recording.url} preload="metadata">
        Your browser does not support audio playback.
      </audio>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {recording.durationSeconds !== null ? (
          <span>Duration: {formatDuration(recording.durationSeconds)}</span>
        ) : null}
        {recording.format ? <span>Format: {recording.format}</span> : null}
      </div>
    </div>
  );
}
