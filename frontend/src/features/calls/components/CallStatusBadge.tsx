import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { CallStatus } from '@/features/calls/schemas';

function statusVariant(status: CallStatus): NonNullable<BadgeProps['variant']> {
  switch (status) {
    case 'in_progress':
      return 'running';
    case 'ringing':
      return 'paused';
    case 'completed':
      return 'completed';
    case 'failed':
    case 'busy':
    case 'no_answer':
    case 'canceled':
      return 'failed';
    default:
      return 'draft';
  }
}

function formatStatusLabel(status: CallStatus): string {
  return status.replace(/_/g, ' ');
}

interface CallStatusBadgeProps {
  status: CallStatus;
}

export function CallStatusBadge({ status }: CallStatusBadgeProps) {
  return (
    <Badge variant={statusVariant(status)} className="capitalize">
      {formatStatusLabel(status)}
    </Badge>
  );
}
