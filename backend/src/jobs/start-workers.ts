import pino from 'pino';
import { closeRedis } from '../config/redis';
import { prisma } from '../config/database';
import { closeQueues } from './queues';
import { createCsvImportWorker } from './workers/csv-import.worker';
import { createCampaignDialerWorker } from './workers/campaign-dialer.worker';
import { createPostCallWorker } from './workers/post-call.worker';

const logger = pino({ name: 'workers' });

const workers = [
  createCsvImportWorker(),
  createCampaignDialerWorker(),
  createPostCallWorker(),
];

logger.info(
  { queues: workers.map((worker) => worker.name) },
  'BullMQ workers started',
);

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down workers');

  await Promise.all(workers.map((worker) => worker.close()));
  await closeQueues();
  await prisma.$disconnect();
  await closeRedis();

  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
