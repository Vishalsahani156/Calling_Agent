import { Worker, type Job } from 'bullmq';
import OpenAI from 'openai';
import pino from 'pino';
import { getBullMQConnection } from '../../config/redis';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { eventBus, AppEvents } from '../../events/event-bus';
import { QUEUE_NAMES, type PostCallJobData } from '../queues';

const logger = pino({ name: 'post-call-worker' });

interface SentimentResult {
  score: number;
  label: 'positive' | 'neutral' | 'negative';
}

function buildSummaryFallback(
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
  ].join('\n');
}

function formatTranscriptForLlm(
  transcripts: Array<{ speaker: string; text: string }>,
): string {
  return transcripts
    .map((entry) => `${entry.speaker}: ${entry.text}`)
    .join('\n');
}

async function generateCallSummary(
  transcripts: Array<{ speaker: string; text: string }>,
  durationSeconds: number | null,
): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    return buildSummaryFallback(transcripts, durationSeconds);
  }

  const conversation = formatTranscriptForLlm(transcripts);
  if (!conversation.trim()) {
    return buildSummaryFallback(transcripts, durationSeconds);
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const durationLabel = durationSeconds != null ? `${durationSeconds} seconds` : 'unknown duration';

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 400,
    messages: [
      {
        role: 'system',
        content:
          'Summarize phone call transcripts for CRM notes. Include key topics, caller intent, outcome, and follow-up actions. Use 2-4 concise sentences.',
      },
      {
        role: 'user',
        content: `Summarize this call (${durationLabel}):\n\n${conversation}`,
      },
    ],
  });

  const summary = response.choices[0]?.message?.content?.trim();
  return summary || buildSummaryFallback(transcripts, durationSeconds);
}

async function analyzeSentiment(
  transcripts: Array<{ speaker: string; text: string }>,
): Promise<SentimentResult> {
  const userText = transcripts
    .filter((entry) => entry.speaker === 'user')
    .map((entry) => entry.text)
    .join(' ');

  if (!userText.trim()) {
    return { score: 0, label: 'neutral' };
  }

  if (!env.OPENAI_API_KEY) {
    return { score: 0, label: 'neutral' };
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: 100,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Analyze caller sentiment from a phone call transcript. Return JSON: {"score": number between -1 and 1, "label": "positive" | "neutral" | "negative"}.',
      },
      {
        role: 'user',
        content: userText,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) {
    return { score: 0, label: 'neutral' };
  }

  try {
    const parsed = JSON.parse(raw) as { score?: number; label?: string };
    const score =
      typeof parsed.score === 'number' && Number.isFinite(parsed.score)
        ? Math.max(-1, Math.min(1, parsed.score))
        : 0;
    const label =
      parsed.label === 'positive' || parsed.label === 'negative' || parsed.label === 'neutral'
        ? parsed.label
        : score > 0.2
          ? 'positive'
          : score < -0.2
            ? 'negative'
            : 'neutral';

    return { score, label };
  } catch {
    return { score: 0, label: 'neutral' };
  }
}

async function processPostCall(job: Job<PostCallJobData>): Promise<{
  callId: string;
  summaryLength: number;
  sentimentLabel: string;
}> {
  const { callId, organizationId } = job.data;

  const call = await prisma.call.findFirst({
    where: { id: callId, organizationId },
    include: {
      transcripts: {
        orderBy: { sequence: 'asc' },
        select: { speaker: true, text: true },
      },
    },
  });

  if (!call) {
    throw new Error(`Call ${callId} not found for organization ${organizationId}`);
  }

  const [summary, sentiment] = await Promise.all([
    generateCallSummary(call.transcripts, call.durationSeconds),
    analyzeSentiment(call.transcripts),
  ]);

  await prisma.call.update({
    where: { id: callId },
    data: {
      summary,
      sentiment: {
        score: sentiment.score,
        label: sentiment.label,
        analyzedAt: new Date().toISOString(),
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

  return {
    callId,
    summaryLength: summary.length,
    sentimentLabel: sentiment.label,
  };
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
