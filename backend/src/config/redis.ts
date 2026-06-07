import type { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return redis;
}

/** Shared Redis client typed for BullMQ (bundled ioredis types differ from the app dependency). */
export function getBullMQConnection(): ConnectionOptions {
  return getRedis() as unknown as ConnectionOptions;
}

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const client = getRedis();
    const result = await client.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
