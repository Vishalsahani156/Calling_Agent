import { Queue, type JobsOptions } from 'bullmq';
import { getBullMQConnection } from '../config/redis';

export const QUEUE_NAMES = {
  CSV_IMPORT: 'csv-import',
  CAMPAIGN_DIALER: 'campaign-dialer',
  POST_CALL: 'post-call',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface CsvImportJobData {
  organizationId: string;
  filePath: string;
  importedById: string;
  campaignId?: string;
  groupId?: string;
}

export interface CampaignDialerJobData {
  campaignId: string;
  organizationId: string;
}

export interface PostCallJobData {
  callId: string;
  organizationId: string;
}

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5_000,
  },
  removeOnComplete: {
    age: 86_400,
    count: 1_000,
  },
  removeOnFail: {
    age: 604_800,
    count: 5_000,
  },
};

const queueInstances = new Map<QueueName, Queue>();

function getOrCreateQueue(name: QueueName): Queue {
  const existing = queueInstances.get(name);
  if (existing) {
    return existing;
  }

  const queue = new Queue(name, { connection: getBullMQConnection() });
  queueInstances.set(name, queue);
  return queue;
}

export async function enqueueCsvImport(
  data: CsvImportJobData,
  options?: JobsOptions,
): Promise<string> {
  const queue = getOrCreateQueue(QUEUE_NAMES.CSV_IMPORT);
  const job = await queue.add('import', data, {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
  });
  return job.id ?? '';
}

export async function enqueueCampaignDial(
  data: CampaignDialerJobData,
  options?: JobsOptions,
): Promise<string> {
  const queue = getOrCreateQueue(QUEUE_NAMES.CAMPAIGN_DIALER);
  const job = await queue.add('dial', data, {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
    jobId: `dial-${data.campaignId}-${Date.now()}`,
  });
  return job.id ?? '';
}

export async function enqueuePostCall(
  data: PostCallJobData,
  options?: JobsOptions,
): Promise<string> {
  const queue = getOrCreateQueue(QUEUE_NAMES.POST_CALL);
  const job = await queue.add('process', data, {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
    jobId: `post-call-${data.callId}`,
  });
  return job.id ?? '';
}

export async function closeQueues(): Promise<void> {
  await Promise.all([...queueInstances.values()].map((queue) => queue.close()));
  queueInstances.clear();
}
