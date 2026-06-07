import { Worker, type Job } from 'bullmq';
import pino from 'pino';
import { getBullMQConnection } from '../../config/redis';
import { prisma } from '../../config/database';
import { eventBus, AppEvents } from '../../events/event-bus';
import { QUEUE_NAMES, type PostCallJobData } from '../queues';

const logger = pino({ name: 'post-call-worker' });

function buildSummaryPlaceholder(
  transcripts: Array<{ speaker: string; text: string }>,
  durationSeconds: number | null,
): string {
  const userLines = transcripts.filter((t) => t.speaker === 'user').map((t) => t.text);
  const agentLines = transcripts.filter((t) => t.speaker === 'agent').map((t) => t.text);

  const durationLabel = durationSeconds != null ? `${durationSeconds}s` : 'unknown duration';
  const userSnippet = userLines.slice(0, 3).join(' ') || 'No caller speech captured.';
  const agentSnippet = agentLines.slice(0, 2).join(' ') || 'No agent responses captured.';

  return [
    `Call summary (${durationLabel}).`,
    `Caller: ${userSnippet}`,
    `Agent: ${agentSnippet}`,
    'Automated summary — replace with LLM-generated summary in production pipeline.',
  ].join('\n');
}

async function processPostCall(job: Job<PostCallJobData>): Promise<{ callId: string; summaryLength: number }> {
  const { callId, organizationId } = job.data;

  const call = await prisma.call.findFirst({
    where: { id: callId, organizationId },
    include: {
      transcripts: {
        orderBy: { createdAt: 'asc' },
        select: { speaker: true, text: true },
      },
    },
  });

  if (!call) {
    throw new Error(`Call ${callId} not found for organization ${organizationId}`);
  }

  const summary = buildSummaryPlaceholder(call.transcripts, call.durationSeconds);

  await prisma.call.update({
    where: { id: callId },
    data: {
      summary,
      sentiment: {
        placeholder: true,
        score: null,
        label: 'pending',
      },
    },
  });

  if (call.campaignId && call.contactId) {
    await prisma.campaignContact.updateMany({
      where: {
        campaignId: call.campaignId,
        contactId: call.contactId,
        status: { in: ['dialing', 'queued', 'connected'] },
      },
      data: { status: 'completed' },
    });
  }

  eventBus.emit(AppEvents.CALL_COMPLETED, { callId, status: call.status });

  return { callId, summaryLength: summary.length };
}

export function createPostCallWorker(): Worker<PostCallJobData> {
  const worker = new Worker<PostCallJobData>(
    QUEUE_NAMES.POST_CALL,
    async (job) => {
      logger.info({ jobId: job.id, callId: job.data.callId }, 'Processing post-call job');
      const result = await processPostCall(job);
      logger.info({ jobId: job.id, ...result }, 'Post-call processing completed');
      return result;
    },
    {
      connection: getBullMQConnection(),
      concurrency: 3,
    },
  );

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'Post-call job failed');
  });

  return worker;
}
