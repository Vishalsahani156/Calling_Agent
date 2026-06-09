import { getAccessToken } from '@/lib/auth';

function resolveWsOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const url = new URL(apiUrl);
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${url.host}`;
}

export function getLiveCallsWebSocketUrl(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  return `${resolveWsOrigin()}/ws/calls/live?token=${encodeURIComponent(token)}`;
}
