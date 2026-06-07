import type WebSocket from 'ws';
import pino from 'pino';
import type { TranscriptSpeaker } from '@prisma/client';
import {
  buildClearFrame,
  buildMediaFrame,
  decodeMediaPayload,
  serializeExotelFrame,
  type ExotelIncomingFrame,
} from '../exotel-protocol';
import type { AgentLlmConfig, VoiceProfile } from '../agent-config';
import { detectEscalationIntent, detectLanguageFromText, resolveTtsVoice } from '../agent-config';
import type { RagRetriever, TranscriptWriter } from '../call-context';
import { formatKbContext } from '../call-context';
import type { ConversationStore } from '../conversation-store';
import { BargeInHandler } from './barge-in-handler';
import { ContextManager } from './context-manager';
import { DtmfHandler } from './dtmf-handler';
import { TurnStateMachine } from './turn-state-machine';

const logger = pino({ name: 'conversation-orchestrator' });

const DEFAULT_MAX_SILENCE_SECONDS = 15;
const CLOSING_MESSAGE = 'Thank you for calling. Goodbye!';

export type ConversationRole = 'system' | 'user' | 'assistant';

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
}

export interface SttSessionConfig {
  sampleRate: number;
  language?: string;
}

export interface SttPartialResult {
  text: string;
  isFinal: boolean;
  detectedLanguage?: string;
}

export interface SttAdapter {
  readonly name: string;
  start(config: SttSessionConfig): Promise<void>;
  feedAudio(chunk: Buffer): void;
  onTranscript(handler: (result: SttPartialResult) => void): void;
  updateLanguage?(language: string): Promise<void>;
  stop(): Promise<void>;
}

export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LlmToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface LlmCompletionResult {
  text: string;
  toolCalls: LlmToolCall[];
}

export interface LlmAdapter {
  readonly name: string;
  complete(messages: ConversationMessage[], options?: LlmCompletionOptions): Promise<string>;
  completeWithTools?(
    messages: ConversationMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult>;
}

export interface TtsSynthesisOptions {
  voice?: string;
  sampleRate?: number;
}

export interface TtsAdapter {
  readonly name: string;
  synthesize(text: string, options?: TtsSynthesisOptions): Promise<Buffer>;
}

export interface OrchestratorConfig {
  callId: string;
  streamSid: string;
  systemPrompt: string;
  greeting: string;
  sampleRate: number;
  stt: SttAdapter;
  llm: LlmAdapter;
  tts: TtsAdapter;
  campaignPrompt?: string;
  ragRetriever?: RagRetriever;
  transcriptWriter?: TranscriptWriter | null;
  interruptionEnabled?: boolean;
  maxSilenceSeconds?: number;
  voiceProfile?: VoiceProfile;
  llmConfig?: AgentLlmConfig;
  leadQualificationEnabled?: boolean;
  dtmfHandler?: DtmfHandler;
  conversationStore?: ConversationStore;
}

export class ConversationOrchestrator {
  private readonly socket: WebSocket;
  private readonly config: OrchestratorConfig;
  private readonly contextManager: ContextManager;
  private readonly stateMachine = new TurnStateMachine();
  private readonly bargeIn: BargeInHandler;
  private readonly dtmfHandler: DtmfHandler | null;
  private readonly conversationStore: ConversationStore | null;
  private processing = false;
  private closed = false;
  private utteranceBuffer = '';
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private languageConfigured = false;

  constructor(socket: WebSocket, config: OrchestratorConfig) {
    this.socket = socket;
    this.config = config;
    this.contextManager = new ContextManager(config.systemPrompt, config.campaignPrompt);
    this.bargeIn = new BargeInHandler(config.interruptionEnabled ?? true);
    this.dtmfHandler = config.dtmfHandler ?? null;
    this.conversationStore = config.conversationStore ?? null;
  }

  async start(): Promise<void> {
    await this.config.stt.start({
      sampleRate: this.config.sampleRate,
    });

    this.config.stt.onTranscript((result) => {
      void this.handleTranscript(result);
    });

    const greeting = configGreeting(this.config.greeting);
    await this.speak(greeting);
    await this.persistTranscript('agent', greeting);

    this.stateMachine.transition('greeting_complete');
    this.resetSilenceTimer();

    const menuPrompt = this.dtmfHandler?.getMenuPrompt();
    if (menuPrompt) {
      await this.speak(menuPrompt);
      await this.persistTranscript('agent', menuPrompt);
    }
  }

  async handleFrame(frame: ExotelIncomingFrame): Promise<void> {
    if (this.closed) {
      return;
    }

    switch (frame.event) {
      case 'connected':
        logger.debug({ callId: this.config.callId }, 'Exotel connected');
        break;

      case 'start':
        logger.info(
          {
            callId: this.config.callId,
            callSid: frame.start?.call_sid,
            streamSid: frame.streamSid,
          },
          'Exotel stream started',
        );
        break;

      case 'media':
        if (frame.media?.payload) {
          const audio = decodeMediaPayload(frame.media.payload);
          this.config.stt.feedAudio(audio);
        }
        break;

      case 'stop':
        logger.info({ callId: this.config.callId, reason: frame.stop?.reason }, 'Exotel stream stopped');
        await this.close();
        break;

      case 'dtmf':
        await this.handleDtmf(frame.dtmf?.digit);
        break;

      case 'mark':
      case 'clear':
        break;
    }
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.clearSilenceTimer();
    await this.config.stt.stop();
  }

  private async handleTranscript(result: SttPartialResult): Promise<void> {
    if (this.stateMachine.isTerminal() || this.closed) {
      return;
    }

    if (!result.isFinal) {
      this.utteranceBuffer = result.text;
      this.resetSilenceTimer();

      if (this.bargeIn.shouldInterrupt(result.text)) {
        await this.handleBargeIn();
      }

      return;
    }

    const text = result.text.trim();
    if (!text) {
      return;
    }

    this.utteranceBuffer = '';
    this.resetSilenceTimer();
    await this.configureLanguage(result.detectedLanguage, text);
    await this.processUserUtterance(text);
  }

  private async handleBargeIn(): Promise<void> {
    if (!this.bargeIn.isSpeaking()) {
      return;
    }

    this.bargeIn.interrupt();
    this.stateMachine.transition('barge_in');
    this.sendClearFrame();
    logger.info({ callId: this.config.callId }, 'Barge-in detected, TTS interrupted');
  }

  private async handleDtmf(digit: string | undefined): Promise<void> {
    if (!digit || !this.dtmfHandler?.isEnabled()) {
      logger.debug({ callId: this.config.callId, digit }, 'DTMF received');
      return;
    }

    const action = this.dtmfHandler.handleDigit(digit);
    logger.info({ callId: this.config.callId, digit, action: action.type }, 'DTMF action');

    switch (action.type) {
      case 'respond':
        this.contextManager.addMessage('user', `DTMF ${digit}: ${action.label}`);
        await this.respondDirectly(action.text);
        break;
      case 'repeat':
        await this.respondDirectly(action.text);
        break;
      case 'escalate':
        await this.initiateHandoff(action.label);
        break;
      case 'none':
        break;
    }
  }

  private async processUserUtterance(text: string): Promise<void> {
    if (this.processing || this.closed || !this.stateMachine.acceptsUserSpeech()) {
      return;
    }

    if (detectEscalationIntent(text)) {
      await this.initiateHandoff(text);
      return;
    }

    this.processing = true;
    this.stateMachine.transition('speech_endpoint');

    try {
      await this.persistTranscript('user', text, this.contextManager.getDetectedLanguage() ?? undefined);
      this.contextManager.addMessage('user', text);

      const reply = await this.generateReply(text);

      if (this.bargeIn.isAborted()) {
        this.bargeIn.clearAborted();
        return;
      }

      this.contextManager.addMessage('assistant', reply);
      this.stateMachine.transition('response_ready');
      await this.speak(reply);
      await this.persistTranscript('agent', reply, this.contextManager.getDetectedLanguage() ?? undefined);
      this.stateMachine.transition('tts_complete');
      this.resetSilenceTimer();
    } catch (error) {
      logger.error({ callId: this.config.callId, err: error }, 'Conversation turn failed');
      this.stateMachine.forceState('listening');
    } finally {
      this.processing = false;
    }
  }

  private async generateReply(text: string): Promise<string> {
    const llmOptions: LlmCompletionOptions = {
      temperature: this.config.llmConfig?.temperature ?? 0.7,
      maxTokens: this.config.llmConfig?.maxTokens ?? 300,
    };

    if (this.config.ragRetriever) {
      const retrieval = await this.config.ragRetriever.retrieve(text);

      if (retrieval.faqMatch) {
        logger.info(
          {
            callId: this.config.callId,
            faqId: retrieval.faqMatch.id,
            similarity: retrieval.faqMatch.similarity,
          },
          'FAQ fast path matched',
        );
        return retrieval.faqMatch.answer;
      }

      const kbContext = formatKbContext(retrieval);
      const extraSystem: ConversationMessage[] = kbContext
        ? [{ role: 'system', content: `Relevant knowledge base context:\n${kbContext}` }]
        : [];

      const messages = this.contextManager.buildMessagesForLlm(extraSystem);

      if (this.config.leadQualificationEnabled && this.config.llm.completeWithTools) {
        const result = await this.config.llm.completeWithTools(messages, llmOptions);
        await this.handleToolCalls(result.toolCalls);
        if (result.text) {
          return result.text;
        }
        return 'Thank you. I have noted your request.';
      }

      return this.config.llm.complete(messages, llmOptions);
    }

    const messages = this.contextManager.buildMessagesForLlm();

    if (this.config.leadQualificationEnabled && this.config.llm.completeWithTools) {
      const result = await this.config.llm.completeWithTools(messages, llmOptions);
      await this.handleToolCalls(result.toolCalls);
      if (result.text) {
        return result.text;
      }
      return 'Thank you. I have noted your request.';
    }

    return this.config.llm.complete(messages, llmOptions);
  }

  private async handleToolCalls(toolCalls: LlmToolCall[]): Promise<void> {
    for (const toolCall of toolCalls) {
      if (toolCall.name === 'qualify_lead') {
        await this.conversationStore?.setLeadQualified(toolCall.arguments);
        logger.info({ callId: this.config.callId, ...toolCall.arguments }, 'Lead qualified');
      }

      if (toolCall.name === 'request_human_handoff') {
        const reason =
          typeof toolCall.arguments.reason === 'string'
            ? toolCall.arguments.reason
            : 'Caller requested human agent';
        await this.initiateHandoff(reason);
      }
    }
  }

  private async initiateHandoff(reason: string): Promise<void> {
    if (this.stateMachine.getState() === 'handoff') {
      return;
    }

    this.stateMachine.transition('escalation');
    this.clearSilenceTimer();
    await this.conversationStore?.setEscalationRequested(reason);

    const handoffMessage =
      'I understand. Let me connect you with a team member who can help you further. Please hold.';
    await this.respondDirectly(handoffMessage);
    this.stateMachine.transition('handoff_complete');
    logger.info({ callId: this.config.callId, reason }, 'Human handoff initiated');
  }

  private async respondDirectly(text: string): Promise<void> {
    this.contextManager.addMessage('assistant', text);
    await this.speak(text);
    await this.persistTranscript('agent', text, this.contextManager.getDetectedLanguage() ?? undefined);
    this.stateMachine.transition('tts_complete');
    this.resetSilenceTimer();
  }

  private async configureLanguage(
    sttLanguage: string | undefined,
    utterance: string,
  ): Promise<void> {
    if (this.languageConfigured) {
      return;
    }

    const detected =
      sttLanguage?.trim().toLowerCase() ||
      detectLanguageFromText(utterance) ||
      null;

    if (!detected) {
      return;
    }

    this.languageConfigured = true;
    this.contextManager.setDetectedLanguage(detected);
    await this.conversationStore?.setDetectedLanguage(detected);

    if (this.config.stt.updateLanguage) {
      await this.config.stt.updateLanguage(detected);
    }

    logger.info({ callId: this.config.callId, language: detected }, 'Language configured');
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();

    if (this.stateMachine.getState() !== 'listening' || this.closed) {
      return;
    }

    const timeoutSeconds = this.config.maxSilenceSeconds ?? DEFAULT_MAX_SILENCE_SECONDS;
    this.silenceTimer = setTimeout(() => {
      void this.handleSilenceTimeout();
    }, timeoutSeconds * 1_000);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private async handleSilenceTimeout(): Promise<void> {
    if (this.closed || this.stateMachine.getState() !== 'listening') {
      return;
    }

    this.stateMachine.transition('silence_timeout');
    logger.info({ callId: this.config.callId }, 'Silence timeout reached');

    await this.speak(CLOSING_MESSAGE);
    await this.persistTranscript('agent', CLOSING_MESSAGE);
    await this.close();
  }

  private async persistTranscript(
    speaker: TranscriptSpeaker,
    text: string,
    language?: string,
  ): Promise<void> {
    if (!this.config.transcriptWriter) {
      return;
    }

    try {
      await this.config.transcriptWriter.append(speaker, text, language);
    } catch (error) {
      logger.error({ callId: this.config.callId, speaker, err: error }, 'Transcript persist failed');
    }
  }

  private sendClearFrame(): void {
    if (this.socket.readyState !== this.socket.OPEN) {
      return;
    }

    const frame = buildClearFrame(this.config.streamSid);
    this.socket.send(serializeExotelFrame(frame));
  }

  private async speak(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const voice = resolveTtsVoice(
      this.config.voiceProfile ?? { default: 'alloy' },
      this.contextManager.getDetectedLanguage(),
    );

    const audio = await this.config.tts.synthesize(trimmed, {
      sampleRate: this.config.sampleRate,
      voice,
    });

    this.bargeIn.startSpeaking();
    this.stateMachine.forceState(
      this.stateMachine.getState() === 'interrupted' ? 'interrupted' : 'speaking',
    );

    const chunkSize = 3_200;
    for (let offset = 0; offset < audio.length; offset += chunkSize) {
      if (this.closed || this.socket.readyState !== this.socket.OPEN || this.bargeIn.isAborted()) {
        this.bargeIn.stopSpeaking();
        return;
      }

      const chunk = audio.subarray(offset, offset + chunkSize);
      const frame = buildMediaFrame(this.config.streamSid, chunk);
      this.socket.send(serializeExotelFrame(frame));
    }

    this.bargeIn.stopSpeaking();
  }
}

function configGreeting(greeting: string): string {
  return greeting.trim() || 'Hello! How can I help you today?';
}
