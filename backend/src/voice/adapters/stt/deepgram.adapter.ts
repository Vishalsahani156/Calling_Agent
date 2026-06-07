import WebSocket from 'ws';
import { env } from '../../../config/env';
import type {
  SttAdapter,
  SttPartialResult,
  SttSessionConfig,
} from '../../orchestrator/conversation-orchestrator';

export interface DeepgramSttConfig {
  apiKey?: string;
  model?: string;
}

type TranscriptHandler = (result: SttPartialResult) => void;

interface DeepgramTranscriptMessage {
  type?: string;
  channel?: {
    alternatives?: Array<{
      transcript?: string;
      languages?: string[];
    }>;
    detected_language?: string;
  };
  metadata?: {
    detected_language?: string;
  };
  is_final?: boolean;
  speech_final?: boolean;
}

export class DeepgramSttAdapter implements SttAdapter {
  readonly name = 'deepgram';

  private readonly apiKey: string;
  private readonly model: string;
  private socket: WebSocket | null = null;
  private transcriptHandler: TranscriptHandler | null = null;
  private sessionConfig: SttSessionConfig | null = null;

  constructor(config: DeepgramSttConfig = {}) {
    const apiKey = config.apiKey ?? env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPGRAM_API_KEY is required for DeepgramSttAdapter');
    }

    this.apiKey = apiKey;
    this.model = config.model ?? 'nova-2';
  }

  async start(config: SttSessionConfig): Promise<void> {
    if (this.socket) {
      await this.stop();
    }

    this.sessionConfig = config;

    const params = new URLSearchParams({
      model: this.model,
      encoding: 'linear16',
      sample_rate: String(config.sampleRate),
      channels: '1',
      punctuate: 'true',
      interim_results: 'true',
      endpointing: '300',
    });

    if (config.language) {
      params.set('language', config.language);
    } else {
      params.set('detect_language', 'true');
    }

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
      });

      socket.once('open', () => {
        this.socket = socket;
        resolve();
      });

      socket.once('error', (error) => {
        reject(error);
      });

      socket.on('message', (data) => {
        this.handleMessage(data);
      });

      socket.on('close', () => {
        this.socket = null;
      });
    });
  }

  feedAudio(chunk: Buffer): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(chunk);
  }

  onTranscript(handler: (result: SttPartialResult) => void): void {
    this.transcriptHandler = handler;
  }

  async updateLanguage(language: string): Promise<void> {
    if (!this.sessionConfig) {
      return;
    }

    await this.start({
      ...this.sessionConfig,
      language,
    });
  }

  async stop(): Promise<void> {
    if (!this.socket) {
      return;
    }

    const socket = this.socket;
    this.socket = null;

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'CloseStream' }));
    }

    await new Promise<void>((resolve) => {
      socket.once('close', () => resolve());
      socket.close();
      setTimeout(resolve, 1_000);
    });

    this.sessionConfig = null;
  }

  private handleMessage(data: WebSocket.RawData): void {
    if (!this.transcriptHandler) {
      return;
    }

    let payload: DeepgramTranscriptMessage;
    try {
      payload = JSON.parse(data.toString()) as DeepgramTranscriptMessage;
    } catch {
      return;
    }

    if (payload.type !== 'Results') {
      return;
    }

    const text = payload.channel?.alternatives?.[0]?.transcript?.trim() ?? '';
    if (!text) {
      return;
    }

    const detectedLanguage =
      payload.metadata?.detected_language ??
      payload.channel?.detected_language ??
      payload.channel?.alternatives?.[0]?.languages?.[0];

    this.transcriptHandler({
      text,
      isFinal: Boolean(payload.is_final || payload.speech_final),
      detectedLanguage: detectedLanguage?.trim() || undefined,
    });
  }
}
