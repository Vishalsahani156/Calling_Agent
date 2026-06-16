import { Worker, type Job } from 'bullmq';
import pino from 'pino';
import { env } from '../../config/env';
import { getBullMQConnection } from '../../config/redis';
import { prisma } from '../../config/database';
import { eventBus, AppEvents } from '../../events/event-bus';
import { scheduleCampaignContactRetry } from '../../modules/campaigns/call-retry.service';
import {
  initiateExotelCall,
  isExotelConfigured,
  resolveExotelCallerId,
  resolveExotelFlowUrl,
} from '../../modules/telephony/exotel.service';
import {
  QUEUE_NAMES,
  enqueueCampaignDial,
  type CampaignDialerJobData,
} from '../queues';

const logger = pino({ name: 'campaign-dialer-worker' });

async function countActiveCalls(campaignId: string): Promise<number> {
  return prisma.call.count({
    where: {
      campaignId,
      status: { in: ['initiated', 'ringing', 'in_progress'] },
    },
  });
}

async function pickNextContact(campaignId: string) {
  const now = new Date();

  return prisma.campaignContact.findFirst({
    where: {
      campaignId,
      OR: [
        { status: 'pending' },
        {
          status: 'queued',
          OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
        },
      ],
      contact: { optOut: false },
    },
    orderBy: [{ nextRetryAt: 'asc' }, { createdAt: 'asc' }],
    include: {
      contact: true,
      campaign: {
        include: {
          aiAgent: true,
        },
      },
    },
  });
}

async function processDialJob(job: Job<CampaignDialerJobData>): Promise<{ action: string; callId?: string }> {
  const { campaignId, organizationId } = job.data;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId },
  });

  if (!campaign || campaign.status !== 'running') {
    logger.info({ campaignId, status: campaign?.status }, 'Campaign not running; skipping dial');
    return { action: 'skipped_not_running' };
  }

  const activeCalls = await countActiveCalls(campaignId);
  if (activeCalls >= campaign.maxConcurrentCalls) {
    logger.info({ campaignId, activeCalls }, 'Concurrent call limit reached; requeueing');
    await enqueueCampaignDial({ campaignId, organizationId }, { delay: 10_000 });
    return { action: 'deferred_concurrency' };
  }

  const campaignContact = await pickNextContact(campaignId);
  if (!campaignContact) {
    logger.info({ campaignId }, 'No pending contacts; dial cycle complete');
    return { action: 'no_contacts' };
  }

  await prisma.campaignContact.update({
    where: { id: campaignContact.id },
    data: {
      status: 'dialing',
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });

  const call = await prisma.call.create({
    data: {
      organizationId,
      campaignId,
      contactId: campaignContact.contactId,
      aiAgentId: campaignContact.campaign.aiAgentId,
      direction: 'outbound',
      status: 'initiated',
      startedAt: new Date(),
    },
  });

  eventBus.emit(AppEvents.CALL_INITIATED, {
    callId: call.id,
    organizationId,
    campaignId,
  });

  const flowUrl = resolveExotelFlowUrl(campaign.exotelFlowUrl);
  const callerId = resolveExotelCallerId(campaign.callerPhone);

  if (!isExotelConfigured() || !flowUrl || !callerId) {
    logger.warn({ callId: call.id }, 'Exotel not configured; call record created without dial');

    await prisma.$transaction([
      prisma.call.update({
        where: { id: call.id },
        data: { status: 'failed' },
      }),
      prisma.campaignContact.update({
        where: { id: campaignContact.id },
        data: { status: 'failed' },
      }),
    ]);

    return { action: 'exotel_not_configured', callId: call.id };
  }

  try {
    const exotelCallSid = await initiateExotelCall({
      toPhone: campaignContact.contact.phone,
      callerId,
      flowUrl,
      customField: call.id,
      statusCallback: `${env.API_BASE_URL}/api/v1/webhooks/exotel/status`,
    });

    await prisma.$transaction([
      prisma.call.update({
        where: { id: call.id },
        data: {
          exotelCallSid,
          status: 'ringing',
        },
      }),
      prisma.campaignContact.update({
        where: { id: campaignContact.id },
        data: { status: 'queued' },
      }),
    ]);

    await enqueueCampaignDial({ campaignId, organizationId }, { delay: 2_000 });

    return { action: 'dialed', callId: call.id };
  } catch (error) {
    await prisma.call.update({
      where: { id: call.id },
      data: { status: 'failed', endedAt: new Date() },
    });

    await scheduleCampaignContactRetry({
      campaignContactId: campaignContact.id,
      campaignId,
      organizationId,
      reason: 'dial_failed',
    });

    logger.error({ callId: call.id, err: error }, 'Exotel dial failed');
    throw error;
  }
}

export function createCampaignDialerWorker(): Worker<CampaignDialerJobData> {
  const worker = new Worker<CampaignDialerJobData>(
    QUEUE_NAMES.CAMPAIGN_DIALER,
    async (job) => {
      logger.info({ jobId: job.id, campaignId: job.data.campaignId }, 'Processing dial job');
      return processDialJob(job);
    },
    {
      connection: getBullMQConnection(),
      concurrency: 5,
    },
  );

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'Campaign dialer job failed');
  });

  return worker;
}
