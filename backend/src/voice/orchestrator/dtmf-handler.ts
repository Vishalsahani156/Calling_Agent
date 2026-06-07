export interface DtmfMenuOption {
  label: string;
  action: 'respond' | 'escalate' | 'repeat';
  response?: string;
}

export interface DtmfMenuConfig {
  enabled: boolean;
  prompt?: string;
  options: Record<string, DtmfMenuOption>;
}

export type DtmfAction =
  | { type: 'none' }
  | { type: 'respond'; text: string; label: string }
  | { type: 'escalate'; label: string }
  | { type: 'repeat'; text: string };

export class DtmfHandler {
  private readonly config: DtmfMenuConfig | null;

  constructor(config: DtmfMenuConfig | null) {
    this.config = config?.enabled ? config : null;
  }

  isEnabled(): boolean {
    return this.config !== null;
  }

  getMenuPrompt(): string | null {
    if (!this.config) {
      return null;
    }

    if (this.config.prompt?.trim()) {
      return this.config.prompt.trim();
    }

    const lines = Object.entries(this.config.options).map(
      ([digit, option]) => `Press ${digit} for ${option.label}`,
    );

    return lines.length > 0 ? `Menu options: ${lines.join('. ')}.` : null;
  }

  handleDigit(digit: string): DtmfAction {
    if (!this.config) {
      return { type: 'none' };
    }

    const option = this.config.options[digit];
    if (!option) {
      return { type: 'none' };
    }

    switch (option.action) {
      case 'escalate':
        return { type: 'escalate', label: option.label };
      case 'repeat': {
        const repeatText = option.response?.trim() || this.getMenuPrompt();
        return repeatText
          ? { type: 'repeat', text: repeatText }
          : { type: 'none' };
      }
      case 'respond':
      default: {
        const text =
          option.response?.trim() ||
          `You selected ${option.label}. How can I help you with that?`;
        return { type: 'respond', text, label: option.label };
      }
    }
  }
}
