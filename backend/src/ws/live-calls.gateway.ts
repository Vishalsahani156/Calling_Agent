import type { Server as HttpServer } from 'http';
import { URL } from 'url';
import WebSocket, { WebSocketServer } from 'ws';
import pino from 'pino';
import { callsRepository } from '../modules/calls/calls.repository';
import { AppEvents } from '../events/event-bus';
import {
  createOrgEventSubscriber,
  type RedisOrgEventMessage,
} from '../events/redis-pubsub';
import { authenticateWsToken } from '../shared/utils/jwt-auth';

const logger = pino({ name: 'live-calls-gateway' });

const LIVE_PATH = '/ws/calls/live';

interface LiveClient {
  socket: WebSocket;
  organizationId: string;
}

const clients = new Set<LiveClient>();

function formatLiveCall(call: {
  id: string;
  exotelCallSid: string | null;
  direction: string;
  status: string;
  startedAt: Date | null;
  answeredAt: Date | null;
  durationSeconds: number | null;
  campaign: { id: string; name: string } | null;
  contact: { id: string; phone: string; firstName: string | null; lastName: string | null } | null;
  aiAgent: { id: string; name: string } | null;
}) {
  return {
    id: call.id,
    exotelCallSid: call.exotelCallSid,
    direction: call.direction,
    status: call.status,
    startedAt: call.startedAt,
    answeredAt: call.answeredAt,
    durationSeconds: call.durationSeconds,
    campaign: call.campaign,
    contact: call.contact,
    aiAgent: call.aiAgent,
  };
}

async function sendSnapshot(client: LiveClient): Promise<void> {
  const calls = await callsRepository.findLive(client.organizationId);
  client.socket.send(
    JSON.stringify({
      type: 'snapshot',
      count: calls.length,
      calls: calls.map(formatLiveCall),
    }),
  );
}

function broadcastToOrg(organizationId: string, payload: Record<string, unknown>): void {
  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.organizationId !== organizationId) {
      continue;
    }
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(message);
    }
  }
}

async function handleOrgEvent(
  organizationId: string,
  message: RedisOrgEventMessage,
): Promise<void> {
  if (
    message.event !== AppEvents.CALL_INITIATED &&
    message.event !== AppEvents.CALL_COMPLETED
  ) {
    return;
  }

  const calls = await callsRepository.findLive(organizationId);
  broadcastToOrg(organizationId, {
    type: 'live_update',
    event: message.event,
    payload: message.payload,
    count: calls.length,
    calls: calls.map(formatLiveCall),
  });
}

export function attachLiveCallsGateway(server: HttpServer): { close: () => Promise<void> } {
  const wss = new WebSocketServer({ noServer: true });
  const subscriber = createOrgEventSubscriber((organizationId, message) => {
    void handleOrgEvent(organizationId, message);
  });

  server.on('upgrade', (request, socket, head) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');
    if (requestUrl.pathname !== LIVE_PATH) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (socket, request) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');
    const token = requestUrl.searchParams.get('token') ?? undefined;

    void (async () => {
      const user = await authenticateWsToken(token);
      if (!user) {
        socket.close(4401, 'Unauthorized');
        return;
      }

      const client: LiveClient = { socket, organizationId: user.organizationId };
      clients.add(client);
      logger.info({ userId: user.id, organizationId: user.organizationId }, 'Live calls WS connected');

      await sendSnapshot(client);

      socket.on('close', () => {
        clients.delete(client);
      });

      socket.on('error', (error) => {
        logger.error({ err: error }, 'Live calls WS error');
        clients.delete(client);
      });
    })();
  });

  logger.info({ path: LIVE_PATH }, 'Live calls WebSocket gateway attached');

  return {
    async close() {
      for (const client of clients) {
        client.socket.close();
      }
      clients.clear();
      await subscriber.close();
      await new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
    },
  };
}
