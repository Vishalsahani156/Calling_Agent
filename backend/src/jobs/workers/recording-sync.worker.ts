import { Worker, type Job } from 'bullmq';
import pino from 'pino';
import { getBullMQConnection } from '../../config/redis';
import { recordingSyncService } from '../../modules/calls/recording-sync.service';
import { QUEUE_NAMES, type RecordingSyncJobData } from '../queues';

const logger = pino({ name: 'recording-sync-worker' });

async function processRecordingSync(job: Job<RecordingSyncJobData>) {
  const { callId, organizationId } = job.data;
  const result = await recordingSyncService.syncCallRecording(callId, organizationId);
  logger.info({ callId, storageUrl: result.storageUrl }, 'Recording synced to storage');
  return result;
}

export function createRecordingSyncWorker(): Worker<RecordingSyncJobData> {
  const worker = new Worker<RecordingSyncJobData>(
    QUEUE_NAMES.RECORDING_SYNC,
    async (job) => processRecordingSync(job),
    {
      connection: getBullMQConnection(),
      concurrency: 2,
    },
  );

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'Recording sync job failed');
  });

  return worker;
}
