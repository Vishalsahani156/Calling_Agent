'use client';

import { useEffect, useRef, useState } from 'react';

import type { CallSummary, LiveCallsWsMessage } from '@/features/calls/types';
import { getLiveCallsWebSocketUrl } from '@/features/calls/utils/ws';

const RECONNECT_DELAY_MS = 3_000;

interface UseLiveCallsWebSocketResult {
  calls: CallSummary[];
  count: number;
  connected: boolean;
  lastEvent: string | null;
}

export function useLiveCallsWebSocket(enabled = true): UseLiveCallsWebSocketResult {
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [count, setCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let disposed = false;

    function applyMessage(message: LiveCallsWsMessage) {
      setCalls(message.calls);
      setCount(message.count);
      if (message.type === 'live_update') {
        setLastEvent(message.event);
      }
    }

    function connect() {
      const url = getLiveCallsWebSocketUrl();
      if (!url || disposed) return;

      socket = new WebSocket(url);

      socket.onopen = () => {
        if (disposed) return;
        setConnected(true);
      };

      socket.onmessage = (event) => {
        if (disposed) return;
        try {
          const message = JSON.parse(String(event.data)) as LiveCallsWsMessage;
          if (message.type === 'snapshot' || message.type === 'live_update') {
            applyMessage(message);
          }
        } catch {
          // ignore malformed messages
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      socket?.close();
    };
  }, [enabled]);

  return { calls, count, connected, lastEvent };
}
