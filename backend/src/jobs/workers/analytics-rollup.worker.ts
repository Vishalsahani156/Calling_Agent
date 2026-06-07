import { Worker, type Job } from 'bullmq';
import pino from 'pino';
import { getBullMQConnection } from '../../config/redis';
import { analyticsRollupService } from '../../modules/analytics/analytics-rollup.service';
import { QUEUE_NAMES, type AnalyticsRollupJobData } from '../queues';

const logger = pino({ name: 'analytics-rollup-worker' });

async function processAnalyticsRollup(job: Job<AnalyticsRollupJobData>) {
  const result = await analyticsRollupService.runRollup({
    organizationId: job.data.organizationId,
    periodStart: job.data.periodStart ? new Date(job.data.periodStart) : undefined,
    periodEnd: job.data.periodEnd ? new Date(job.data.periodEnd) : undefined,
  });

  logger.info(
    {
      jobId: job.id,
      organizationsProcessed: result.organizationsProcessed,
      rollupsWritten: result.rollupsWritten,
    },
    'Analytics rollup completed',
  );

  return result;
}

export function createAnalyticsRollupWorker(): Worker<AnalyticsRollupJobData> {
  const worker = new Worker<AnalyticsRollupJobData>(
    QUEUE_NAMES.ANALYTICS_ROLLUP,
    async (job) => processAnalyticsRollup(job),
    {
      connection: getBullMQConnection(),
      concurrency: 1,
    },
  );

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'Analytics rollup job failed');
  });

  return worker;
}
