import { Badge } from '@/components/ui/badge';
import type { DocumentStatus, SourceType } from '@/features/knowledge/schemas';

const STATUS_VARIANT: Record<DocumentStatus, 'paused' | 'running' | 'failed'> = {
  processing: 'paused',
  ready: 'running',
  failed: 'failed',
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}

export function SourceTypeBadge({ sourceType }: { sourceType: SourceType }) {
  return <Badge variant="outline">{sourceType}</Badge>;
}
