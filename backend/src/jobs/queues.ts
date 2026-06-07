import { Queue, type JobsOptions } from 'bullmq';
import { getBullMQConnection } from '../config/redis';

export const QUEUE_NAMES = {
  CSV_IMPORT: 'csv-import',
  CAMPAIGN_DIALER: 'campaign-dialer',
  CALL_RETRY: 'call-retry',
  POST_CALL: 'post-call',
  RECORDING_SYNC: 'recording-sync',
  ANALYTICS_ROLLUP: 'analytics-rollup',
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

export interface CallRetryJobData {
  campaignContactId: string;
  campaignId: string;
  organizationId: string;
  reason: string;
}

export interface PostCallJobData {
  callId: string;
  organizationId: string;
}

export interface RecordingSyncJobData {
  callId: string;
  organizationId: string;
}

export interface AnalyticsRollupJobData {
  organizationId?: string;
  periodStart?: string;
  periodEnd?: string;
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

export function getQueue(name: QueueName): Queue {
  return getOrCreateQueue(name);
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

export async function enqueueCallRetry(
  data: CallRetryJobData,
  options?: JobsOptions,
): Promise<string> {
  const queue = getOrCreateQueue(QUEUE_NAMES.CALL_RETRY);
  const job = await queue.add('retry', data, {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
    jobId: `call-retry-${data.campaignContactId}-${Date.now()}`,
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

export async function enqueueRecordingSync(
  data: RecordingSyncJobData,
  options?: JobsOptions,
): Promise<string> {
  const queue = getOrCreateQueue(QUEUE_NAMES.RECORDING_SYNC);
  const job = await queue.add('sync', data, {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
    jobId: `recording-sync-${data.callId}`,
  });
  return job.id ?? '';
}

export async function enqueueAnalyticsRollup(
  data: AnalyticsRollupJobData = {},
  options?: JobsOptions,
): Promise<string> {
  const queue = getOrCreateQueue(QUEUE_NAMES.ANALYTICS_ROLLUP);
  const job = await queue.add('rollup', data, {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
  });
  return job.id ?? '';
}

export async function closeQueues(): Promise<void> {
  await Promise.all([...queueInstances.values()].map((queue) => queue.close()));
  queueInstances.clear();
}
