import http from 'http';
import { URL } from 'url';
import WebSocket, { WebSocketServer } from 'ws';
import pino from 'pino';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { closeRedis } from '../config/redis';
import { resolveAgentConfig } from './agent-config';
import { ExotelProtocolError, parseExotelFrame } from './exotel-protocol';
import {
  buildCampaignPrompt,
  createRagRetriever,
  createTranscriptWriter,
} from './call-context';
import { callCompletionService } from '../modules/calls/call-completion.service';
import { ConversationStore } from './conversation-store';
import { ConversationOrchestrator } from './orchestrator/conversation-orchestrator';
import { DtmfHandler } from './orchestrator/dtmf-handler';
import { DeepgramSttAdapter } from './adapters/stt/deepgram.adapter';
import { OpenAiLlmAdapter } from './adapters/llm/openai.adapter';
import { OpenAiTtsAdapter } from './adapters/tts/openai.adapter';

const logger = pino({ name: 'voice-ws-server' });

const DEFAULT_SAMPLE_RATE = 8_000;
const DEFAULT_GREETING = 'Hello! How can I help you today?';

interface ActiveSession {
  orchestrator: ConversationOrchestrator;
  streamSid?: string;
  callId?: string;
  organizationId?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sessions = new Map<WebSocket, ActiveSession>();

function parseSampleRate(raw: string | number | undefined): number {
  if (raw === undefined) {
    return DEFAULT_SAMPLE_RATE;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SAMPLE_RATE;
}

function resolveGreeting(
  greetingScript: Record<string, string>,
  language = 'en',
): string {
  const localized = greetingScript[language];
  if (localized?.trim()) {
    return localized;
  }

  const fallback = greetingScript.en;
  if (fallback?.trim()) {
    return fallback;
  }

  return DEFAULT_GREETING;
}

async function resolveCallContext(customParameters: Record<string, string> | undefined) {
  const callId = customParameters?.callId ?? customParameters?.call_id;
  if (!callId) {
    return null;
  }

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      aiAgent: true,
      campaign: {
        include: {
          knowledgeBase: { select: { id: true, defaultLanguage: true } },
        },
      },
    },
  });

  if (!call?.aiAgent) {
    return null;
  }

  const agentConfig = resolveAgentConfig(call.aiAgent);
  const knowledgeBaseId = call.campaign?.knowledgeBaseId ?? null;
  const kbLanguage = call.campaign?.knowledgeBase?.defaultLanguage;

  const dtmfMenu = agentConfig.toolsConfig.dtmfMenu;
  const dtmfHandler =
    dtmfMenu?.enabled && dtmfMenu.options
      ? new DtmfHandler({
          enabled: true,
          prompt: dtmfMenu.prompt,
          options: Object.fromEntries(
            Object.entries(dtmfMenu.options).map(([digit, option]) => [
              digit,
              {
                label: option.label,
                action: option.action ?? 'respond',
                response: option.response,
              },
            ]),
          ),
        })
      : null;

  return {
    callId: call.id,
    organizationId: call.organizationId,
    systemPrompt: call.aiAgent.personalityPrompt,
    greeting: resolveGreeting(agentConfig.greetingScript),
    sampleRate: DEFAULT_SAMPLE_RATE,
    knowledgeBaseId,
    kbLanguage,
    campaignPrompt: call.campaign
      ? buildCampaignPrompt({
          name: call.campaign.name,
          description: call.campaign.description,
        })
      : undefined,
    agentConfig,
    dtmfHandler,
  };
}

function createOrchestrator(
  socket: WebSocket,
  params: {
    callId: string;
    streamSid: string;
    systemPrompt: string;
    greeting: string;
    sampleRate: number;
    organizationId?: string;
    knowledgeBaseId?: string | null;
    kbLanguage?: string;
    campaignPrompt?: string;
    agentConfig?: ReturnType<typeof resolveAgentConfig>;
    dtmfHandler?: DtmfHandler | null;
  },
): ConversationOrchestrator {
  const ragRetriever =
    params.knowledgeBaseId && params.organizationId
      ? createRagRetriever(params.knowledgeBaseId, params.organizationId, params.kbLanguage)
      : undefined;

  const agentConfig = params.agentConfig;

  return new ConversationOrchestrator(socket, {
    callId: params.callId,
    streamSid: params.streamSid,
    systemPrompt: params.systemPrompt,
    greeting: params.greeting,
    sampleRate: params.sampleRate,
    campaignPrompt: params.campaignPrompt,
    ragRetriever,
    transcriptWriter: createTranscriptWriter(params.callId),
    interruptionEnabled: agentConfig?.interruptionEnabled ?? true,
    maxSilenceSeconds: agentConfig?.maxSilenceSeconds ?? 15,
    voiceProfile: agentConfig?.voiceProfile,
    llmConfig: agentConfig?.llmConfig,
    leadQualificationEnabled: agentConfig?.toolsConfig.leadQualification === true,
    dtmfHandler: params.dtmfHandler ?? undefined,
    conversationStore: new ConversationStore(params.callId),
    stt: new DeepgramSttAdapter(),
    llm: new OpenAiLlmAdapter({ model: agentConfig?.llmConfig.model }),
    tts: new OpenAiTtsAdapter(),
  });
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Voice WebSocket server');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket, request) => {
  const requestUrl = request.url ? new URL(request.url, 'http://localhost') : null;
  logger.info({ path: requestUrl?.pathname }, 'Exotel WebSocket connected');

  socket.on('message', (raw) => {
    void handleMessage(socket, raw);
  });

  socket.on('close', () => {
    void teardownSession(socket);
  });

  socket.on('error', (error) => {
    logger.error({ err: error }, 'WebSocket error');
    void teardownSession(socket);
  });
});

function toMessageBuffer(raw: WebSocket.RawData): Buffer {
  if (Buffer.isBuffer(raw)) {
    return raw;
  }

  if (Array.isArray(raw)) {
    return Buffer.concat(raw);
  }

  if (raw instanceof ArrayBuffer) {
    return Buffer.from(raw);
  }

  return Buffer.from(raw);
}

async function handleMessage(socket: WebSocket, raw: WebSocket.RawData): Promise<void> {
  let frame;

  try {
    frame = parseExotelFrame(toMessageBuffer(raw));
  } catch (error) {
    if (error instanceof ExotelProtocolError) {
      logger.warn({ err: error }, 'Ignoring invalid Exotel frame');
      return;
    }
    throw error;
  }

  let session = sessions.get(socket);

  if (frame.event === 'start' && !session) {
    const streamSid = frame.streamSid ?? frame.start?.stream_sid;
    if (!streamSid) {
      logger.warn('Start frame missing stream_sid');
      return;
    }

    const callContext = await resolveCallContext(frame.start?.custom_parameters);
    const callId = callContext?.callId ?? frame.start?.call_sid ?? streamSid;

    const orchestrator = createOrchestrator(socket, {
      callId,
      streamSid,
      systemPrompt: callContext?.systemPrompt ?? 'You are a helpful voice assistant.',
      greeting: callContext?.greeting ?? DEFAULT_GREETING,
      sampleRate: parseSampleRate(frame.start?.media_format?.sample_rate),
      organizationId: callContext?.organizationId,
      knowledgeBaseId: callContext?.knowledgeBaseId,
      kbLanguage: callContext?.kbLanguage,
      campaignPrompt: callContext?.campaignPrompt,
      agentConfig: callContext?.agentConfig,
      dtmfHandler: callContext?.dtmfHandler ?? null,
    });

    session = {
      orchestrator,
      streamSid,
      callId: callContext?.callId,
      organizationId: callContext?.organizationId,
    };
    sessions.set(socket, session);

    await orchestrator.start();

    if (callContext?.callId) {
      await prisma.call.update({
        where: { id: callContext.callId },
        data: {
          status: 'in_progress',
          answeredAt: new Date(),
          exotelCallSid: frame.start?.call_sid ?? undefined,
        },
      });
    }
  }

  if (!session) {
    return;
  }

  await session.orchestrator.handleFrame(frame);
}

async function finalizeCallSession(session: ActiveSession): Promise<void> {
  if (!session.callId || !session.organizationId || !UUID_RE.test(session.callId)) {
    return;
  }

  const call = await prisma.call.findFirst({
    where: { id: session.callId, organizationId: session.organizationId },
    select: { id: true, organizationId: true, status: true },
  });

  if (!call) {
    return;
  }

  let finalStatus = call.status;

  if (call.status === 'in_progress' || call.status === 'ringing') {
    await prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'completed',
        endedAt: new Date(),
      },
    });
    finalStatus = 'completed';
  }

  await callCompletionService.handleCallEnded({
    callId: call.id,
    organizationId: call.organizationId,
    status: finalStatus,
  });
}

async function teardownSession(socket: WebSocket): Promise<void> {
  const session = sessions.get(socket);
  if (!session) {
    return;
  }

  sessions.delete(socket);
  await session.orchestrator.close();
  await finalizeCallSession(session);
}

server.listen(env.VOICE_WS_PORT, () => {
  logger.info({ port: env.VOICE_WS_PORT }, 'Voice WebSocket server listening');
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down voice server');

  await Promise.all(
    [...sessions.entries()].map(async ([socket, session]) => {
      sessions.delete(socket);
      await session.orchestrator.close();
      socket.close();
    }),
  );

  await new Promise<void>((resolve) => {
    wss.close(() => resolve());
  });

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
