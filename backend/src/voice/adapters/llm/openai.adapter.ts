import OpenAI from 'openai';
import { env } from '../../../config/env';
import type {
  ConversationMessage,
  LlmAdapter,
  LlmCompletionOptions,
  LlmCompletionResult,
} from '../../orchestrator/conversation-orchestrator';
import { LEAD_QUALIFICATION_TOOLS } from '../../lead-qualification';

export interface OpenAiLlmConfig {
  model?: string;
  apiKey?: string;
}

export class OpenAiLlmAdapter implements LlmAdapter {
  readonly name = 'openai';
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: OpenAiLlmConfig = {}) {
    const apiKey = config.apiKey ?? env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAiLlmAdapter');
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model ?? 'gpt-4o-mini';
  }

  async complete(
    messages: ConversationMessage[],
    options: LlmCompletionOptions = {},
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 300,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('OpenAI returned an empty completion');
    }

    return content;
  }

  async completeWithTools(
    messages: ConversationMessage[],
    options: LlmCompletionOptions = {},
  ): Promise<LlmCompletionResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 300,
      tools: LEAD_QUALIFICATION_TOOLS,
      tool_choice: 'auto',
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const choice = response.choices[0]?.message;
    const toolCalls = (choice?.tool_calls ?? []).flatMap((toolCall) => {
      if (toolCall.type !== 'function') {
        return [];
      }

      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      } catch {
        parsedArgs = {};
      }

      return [
        {
          name: toolCall.function.name,
          arguments: parsedArgs,
        },
      ];
    });

    return {
      text: choice?.content?.trim() ?? '',
      toolCalls,
    };
  }
}
