import type { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 2_000,
      lazyConnect: true,
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
    if (client.status === 'wait') {
      await Promise.race([
        client.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis connect timeout')), 2_000),
        ),
      ]);
    }
    const result = await Promise.race([
      client.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), 2_000),
      ),
    ]);
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
