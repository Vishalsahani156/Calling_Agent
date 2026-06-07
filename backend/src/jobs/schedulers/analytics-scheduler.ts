import pino from 'pino';
import { getQueue, QUEUE_NAMES } from '../queues';

const logger = pino({ name: 'analytics-scheduler' });

const ROLLUP_CRON = '0 2 * * *';

export async function registerAnalyticsRollupScheduler(): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.ANALYTICS_ROLLUP);

  await queue.add(
    'rollup',
    {},
    {
      repeat: { pattern: ROLLUP_CRON },
      jobId: 'analytics-rollup-daily',
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  logger.info({ cron: ROLLUP_CRON }, 'Analytics rollup scheduler registered');
}
