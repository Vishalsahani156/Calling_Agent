import pino from 'pino';
import { getRedis } from '../config/redis';
import { AppEvents, type EventPayloads } from './event-bus';

const logger = pino({ name: 'redis-pubsub' });

const ORG_CHANNEL_PREFIX = 'app:events:org:';

export interface RedisOrgEventMessage {
  event: AppEvents;
  payload: EventPayloads[AppEvents];
  publishedAt: string;
}

export function getOrgEventChannel(organizationId: string): string {
  return `${ORG_CHANNEL_PREFIX}${organizationId}`;
}

export async function publishOrgEvent<K extends AppEvents>(
  organizationId: string,
  event: K,
  payload: EventPayloads[K],
): Promise<void> {
  const message: RedisOrgEventMessage = {
    event,
    payload,
    publishedAt: new Date().toISOString(),
  };

  try {
    const redis = getRedis();
    await redis.publish(getOrgEventChannel(organizationId), JSON.stringify(message));
  } catch (error) {
    logger.error({ err: error, event, organizationId }, 'Failed to publish org event to Redis');
  }
}

export function createOrgEventSubscriber(
  onMessage: (organizationId: string, message: RedisOrgEventMessage) => void,
): { close: () => Promise<void> } {
  const redis = getRedis().duplicate();
  const pattern = `${ORG_CHANNEL_PREFIX}*`;

  void redis.psubscribe(pattern);

  redis.on('pmessage', (_pattern, channel, raw) => {
    const organizationId = channel.replace(ORG_CHANNEL_PREFIX, '');
    try {
      const message = JSON.parse(raw) as RedisOrgEventMessage;
      onMessage(organizationId, message);
    } catch (error) {
      logger.warn({ err: error, channel }, 'Invalid Redis org event payload');
    }
  });

  return {
    async close() {
      await redis.quit();
    },
  };
}
