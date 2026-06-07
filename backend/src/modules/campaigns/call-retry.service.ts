import { CallStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { enqueueCallRetry } from '../../jobs/queues';
import { parseRetryPolicy, shouldRetryContact } from '../../jobs/shared/retry-policy';

export const RETRYABLE_CALL_STATUSES: CallStatus[] = [
  CallStatus.busy,
  CallStatus.no_answer,
  CallStatus.failed,
];

export async function scheduleCampaignContactRetry(params: {
  campaignContactId: string;
  campaignId: string;
  organizationId: string;
  reason: string;
}): Promise<{ action: 'scheduled' | 'exhausted' | 'skipped'; nextRetryAt?: Date }> {
  const [contact, campaign] = await Promise.all([
    prisma.campaignContact.findFirst({
      where: {
        id: params.campaignContactId,
        campaignId: params.campaignId,
        campaign: { organizationId: params.organizationId },
      },
    }),
    prisma.campaign.findFirst({
      where: { id: params.campaignId, organizationId: params.organizationId },
    }),
  ]);

  if (!contact || !campaign) {
    return { action: 'skipped' };
  }

  if (contact.status === 'completed' || contact.status === 'failed') {
    return { action: 'skipped' };
  }

  const policy = parseRetryPolicy(campaign.retryPolicy);
  if (!shouldRetryContact(contact.attemptCount, policy)) {
    await prisma.campaignContact.update({
      where: { id: contact.id },
      data: { status: 'failed', nextRetryAt: null },
    });
    return { action: 'exhausted' };
  }

  const delayMs = policy.retryDelayMinutes * 60_000;
  const nextRetryAt = new Date(Date.now() + delayMs);

  await prisma.campaignContact.update({
    where: { id: contact.id },
    data: {
      status: 'queued',
      nextRetryAt,
    },
  });

  await enqueueCallRetry(
    {
      campaignContactId: contact.id,
      campaignId: params.campaignId,
      organizationId: params.organizationId,
      reason: params.reason,
    },
    { delay: delayMs },
  );

  return { action: 'scheduled', nextRetryAt };
}

export async function scheduleRetryForCall(params: {
  callId: string;
  organizationId: string;
  status: CallStatus;
}): Promise<{ action: 'scheduled' | 'exhausted' | 'skipped' }> {
  if (!RETRYABLE_CALL_STATUSES.includes(params.status)) {
    return { action: 'skipped' };
  }

  const call = await prisma.call.findFirst({
    where: { id: params.callId, organizationId: params.organizationId },
    select: { campaignId: true, contactId: true },
  });

  if (!call?.campaignId || !call.contactId) {
    return { action: 'skipped' };
  }

  const contact = await prisma.campaignContact.findUnique({
    where: {
      campaignId_contactId: {
        campaignId: call.campaignId,
        contactId: call.contactId,
      },
    },
  });

  if (!contact) {
    return { action: 'skipped' };
  }

  const result = await scheduleCampaignContactRetry({
    campaignContactId: contact.id,
    campaignId: call.campaignId,
    organizationId: params.organizationId,
    reason: params.status,
  });

  return { action: result.action };
}
