import OpenAI from 'openai';
import { env } from '../../../config/env';
import type { TtsAdapter, TtsSynthesisOptions } from '../../orchestrator/conversation-orchestrator';

export interface OpenAiTtsConfig {
  apiKey?: string;
  model?: string;
  voice?: OpenAI.Audio.SpeechCreateParams['voice'];
}

export class OpenAiTtsAdapter implements TtsAdapter {
  readonly name = 'openai';

  private readonly client: OpenAI;
  private readonly model: string;
  private readonly defaultVoice: OpenAI.Audio.SpeechCreateParams['voice'];

  constructor(config: OpenAiTtsConfig = {}) {
    const apiKey = config.apiKey ?? env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAiTtsAdapter');
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model ?? 'gpt-4o-mini-tts';
    this.defaultVoice = config.voice ?? 'alloy';
  }

  async synthesize(text: string, options: TtsSynthesisOptions = {}): Promise<Buffer> {
    const trimmed = text.trim();
    if (!trimmed) {
      return Buffer.alloc(0);
    }

    const response = await this.client.audio.speech.create({
      model: this.model,
      voice: (options.voice as OpenAI.Audio.SpeechCreateParams['voice']) ?? this.defaultVoice,
      input: trimmed,
      response_format: 'pcm',
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
