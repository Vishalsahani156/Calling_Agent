export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatDurationSeconds(seconds: number): string {
  if (!seconds) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  if (minutes === 0) return `${remainder}s`;
  return `${minutes}m ${remainder}s`;
}

export function toIsoDatetime(localValue: string | undefined): string | undefined {
  if (!localValue?.trim()) return undefined;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function fromIsoDatetime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultDateRange(): { fromLocal: string; toLocal: string } {
  const to = new Date();
  const from = new Date(Date.now() - 6 * 86400000);
  return {
    fromLocal: fromIsoDatetime(from),
    toLocal: fromIsoDatetime(to),
  };
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}
