import { Worker, type Job } from 'bullmq';
import pino from 'pino';
import { getBullMQConnection } from '../../config/redis';
import { prisma } from '../../config/database';
import { parseRetryPolicy, shouldRetryContact } from '../shared/retry-policy';
import {
  QUEUE_NAMES,
  enqueueCampaignDial,
  type CallRetryJobData,
} from '../queues';

const logger = pino({ name: 'call-retry-worker' });

async function processCallRetry(
  job: Job<CallRetryJobData>,
): Promise<{ action: string; campaignContactId: string }> {
  const { campaignContactId, campaignId, organizationId, reason } = job.data;

  const contact = await prisma.campaignContact.findFirst({
    where: {
      id: campaignContactId,
      campaignId,
      campaign: { organizationId },
    },
  });

  if (!contact) {
    return { action: 'contact_not_found', campaignContactId };
  }

  if (contact.status === 'completed' || contact.status === 'failed') {
    return { action: 'skipped_terminal_status', campaignContactId };
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId },
  });

  if (!campaign || campaign.status !== 'running') {
    return { action: 'campaign_not_running', campaignContactId };
  }

  const policy = parseRetryPolicy(campaign.retryPolicy);
  if (!shouldRetryContact(contact.attemptCount, policy)) {
    await prisma.campaignContact.update({
      where: { id: contact.id },
      data: { status: 'failed', nextRetryAt: null },
    });
    return { action: 'retry_exhausted', campaignContactId };
  }

  await prisma.campaignContact.update({
    where: { id: contact.id },
    data: {
      status: 'queued',
      nextRetryAt: null,
    },
  });

  await enqueueCampaignDial({ campaignId, organizationId });

  logger.info(
    { campaignContactId, campaignId, reason },
    'Call retry processed; dialer re-enqueued',
  );

  return { action: 'dial_enqueued', campaignContactId };
}

export function createCallRetryWorker(): Worker<CallRetryJobData> {
  const worker = new Worker<CallRetryJobData>(
    QUEUE_NAMES.CALL_RETRY,
    async (job) => processCallRetry(job),
    {
      connection: getBullMQConnection(),
      concurrency: 5,
    },
  );

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'Call retry job failed');
  });

  return worker;
}
