import type { ConversationMessage } from './conversation-orchestrator';

const MAX_HISTORY_MESSAGES = 20;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  mr: 'Marathi',
  bn: 'Bengali',
  gu: 'Gujarati',
  pa: 'Punjabi',
};

export class ContextManager {
  private readonly baseSystemPrompt: string;
  private readonly campaignPrompt?: string;
  private detectedLanguage: string | null = null;
  private readonly history: ConversationMessage[] = [];

  constructor(baseSystemPrompt: string, campaignPrompt?: string) {
    this.baseSystemPrompt = baseSystemPrompt.trim();
    this.campaignPrompt = campaignPrompt?.trim() || undefined;
  }

  getDetectedLanguage(): string | null {
    return this.detectedLanguage;
  }

  setDetectedLanguage(language: string): void {
    const normalized = language.trim().toLowerCase();
    if (normalized) {
      this.detectedLanguage = normalized;
    }
  }

  addMessage(role: ConversationMessage['role'], content: string): void {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    this.history.push({ role, content: trimmed });

    if (this.history.length > MAX_HISTORY_MESSAGES) {
      const overflow = this.history.length - MAX_HISTORY_MESSAGES;
      this.history.splice(0, overflow);
    }
  }

  getHistory(): ConversationMessage[] {
    return [...this.history];
  }

  buildSystemMessages(): ConversationMessage[] {
    const parts = [this.baseSystemPrompt];

    if (this.campaignPrompt) {
      parts.push(this.campaignPrompt);
    }

    parts.push(
      'Use the provided knowledge base context when relevant. Keep replies short and natural for voice.',
    );

    if (this.detectedLanguage) {
      const languageName = LANGUAGE_NAMES[this.detectedLanguage] ?? this.detectedLanguage;
      parts.push(
        `Respond in ${languageName} (${this.detectedLanguage}). Keep replies short and natural for voice.`,
      );
    }

    return [{ role: 'system', content: parts.join('\n\n') }];
  }

  buildMessagesForLlm(extraSystemMessages: ConversationMessage[] = []): ConversationMessage[] {
    return [...this.buildSystemMessages(), ...extraSystemMessages, ...this.history];
  }
}
