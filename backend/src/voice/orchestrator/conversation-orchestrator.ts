import type WebSocket from 'ws';
import pino from 'pino';
import type { TranscriptSpeaker } from '@prisma/client';
import {
  buildMediaFrame,
  decodeMediaPayload,
  serializeExotelFrame,
  type ExotelIncomingFrame,
} from '../exotel-protocol';
import type { RagRetriever, TranscriptWriter } from '../call-context';
import { formatKbContext } from '../call-context';

const logger = pino({ name: 'conversation-orchestrator' });

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
}

export interface SttAdapter {
  readonly name: string;
  start(config: SttSessionConfig): Promise<void>;
  feedAudio(chunk: Buffer): void;
  onTranscript(handler: (result: SttPartialResult) => void): void;
  stop(): Promise<void>;
}

export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LlmAdapter {
  readonly name: string;
  complete(messages: ConversationMessage[], options?: LlmCompletionOptions): Promise<string>;
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
}

export class ConversationOrchestrator {
  private readonly messages: ConversationMessage[] = [];
  private readonly socket: WebSocket;
  private readonly config: OrchestratorConfig;
  private processing = false;
  private closed = false;
  private utteranceBuffer = '';

  constructor(socket: WebSocket, config: OrchestratorConfig) {
    this.socket = socket;
    this.config = config;

    const systemParts = [config.systemPrompt.trim()];
    if (config.campaignPrompt?.trim()) {
      systemParts.push(config.campaignPrompt.trim());
    }
    systemParts.push(
      'Use the provided knowledge base context when relevant. Keep replies short and natural for voice.',
    );

    this.messages.push({ role: 'system', content: systemParts.join('\n\n') });
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
        logger.debug({ callId: this.config.callId, digit: frame.dtmf?.digit }, 'DTMF received');
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
    await this.config.stt.stop();
  }

  private async handleTranscript(result: SttPartialResult): Promise<void> {
    if (result.isFinal) {
      const text = result.text.trim();
      if (!text) {
        return;
      }

      this.utteranceBuffer = '';
      await this.processUserUtterance(text);
      return;
    }

    this.utteranceBuffer = result.text;
  }

  private async processUserUtterance(text: string): Promise<void> {
    if (this.processing || this.closed) {
      return;
    }

    this.processing = true;

    try {
      await this.persistTranscript('user', text);
      this.messages.push({ role: 'user', content: text });

      let reply: string;

      if (this.config.ragRetriever) {
        const retrieval = await this.config.ragRetriever.retrieve(text);

        if (retrieval.faqMatch) {
          reply = retrieval.faqMatch.answer;
          logger.info(
            {
              callId: this.config.callId,
              faqId: retrieval.faqMatch.id,
              similarity: retrieval.faqMatch.similarity,
            },
            'FAQ fast path matched',
          );
        } else {
          const kbContext = formatKbContext(retrieval);
          const messagesForLlm = kbContext
            ? [
                ...this.messages.slice(0, 1),
                {
                  role: 'system' as const,
                  content: `Relevant knowledge base context:\n${kbContext}`,
                },
                ...this.messages.slice(1),
              ]
            : this.messages;

          reply = await this.config.llm.complete(messagesForLlm, {
            temperature: 0.7,
            maxTokens: 300,
          });
        }
      } else {
        reply = await this.config.llm.complete(this.messages, {
          temperature: 0.7,
          maxTokens: 300,
        });
      }

      this.messages.push({ role: 'assistant', content: reply });
      await this.speak(reply);
      await this.persistTranscript('agent', reply);
    } catch (error) {
      logger.error({ callId: this.config.callId, err: error }, 'Conversation turn failed');
    } finally {
      this.processing = false;
    }
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

  private async speak(text: string): Promise<void> {
    const audio = await this.config.tts.synthesize(text, {
      sampleRate: this.config.sampleRate,
    });

    const chunkSize = 3_200;
    for (let offset = 0; offset < audio.length; offset += chunkSize) {
      if (this.closed || this.socket.readyState !== this.socket.OPEN) {
        return;
      }

      const chunk = audio.subarray(offset, offset + chunkSize);
      const frame = buildMediaFrame(this.config.streamSid, chunk);
      this.socket.send(serializeExotelFrame(frame));
    }
  }
}

function configGreeting(greeting: string): string {
  return greeting.trim() || 'Hello! How can I help you today?';
}
