import type OpenAI from 'openai';

export interface VoiceProfile {
  default?: string;
  [language: string]: string | undefined;
}

export interface AgentLlmConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DtmfMenuOptionConfig {
  label: string;
  action?: 'respond' | 'escalate' | 'repeat';
  response?: string;
}

export interface AgentToolsConfig {
  leadQualification?: boolean;
  dtmfMenu?: {
    enabled?: boolean;
    prompt?: string;
    options?: Record<string, DtmfMenuOptionConfig>;
  };
}

export interface ResolvedAgentConfig {
  interruptionEnabled: boolean;
  maxSilenceSeconds: number;
  llmConfig: AgentLlmConfig;
  toolsConfig: AgentToolsConfig;
  voiceProfile: VoiceProfile;
  greetingScript: Record<string, string>;
}

export function parseVoiceProfile(raw: unknown): VoiceProfile {
  if (!raw || typeof raw !== 'object') {
    return { default: 'alloy' };
  }

  const profile = raw as Record<string, unknown>;
  const result: VoiceProfile = {};

  for (const [key, value] of Object.entries(profile)) {
    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim();
    }
  }

  if (!result.default) {
    result.default = 'alloy';
  }

  return result;
}

export function parseGreetingScript(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') {
    return { en: 'Hello! How can I help you today?' };
  }

  const scripts = raw as Record<string, unknown>;
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(scripts)) {
    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim();
    }
  }

  return result;
}

export function parseLlmConfig(raw: unknown): AgentLlmConfig {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const config = raw as Record<string, unknown>;
  return {
    model: typeof config.model === 'string' ? config.model : undefined,
    temperature: typeof config.temperature === 'number' ? config.temperature : undefined,
    maxTokens: typeof config.maxTokens === 'number' ? config.maxTokens : undefined,
  };
}

export function parseToolsConfig(raw: unknown): AgentToolsConfig {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const tools = raw as Record<string, unknown>;
  const result: AgentToolsConfig = {};

  if (tools.leadQualification === true) {
    result.leadQualification = true;
  }

  const dtmfMenu = tools.dtmfMenu;
  if (dtmfMenu && typeof dtmfMenu === 'object') {
    const menu = dtmfMenu as Record<string, unknown>;
    const options = menu.options;
    const parsedOptions: Record<string, DtmfMenuOptionConfig> = {};

    if (options && typeof options === 'object') {
      for (const [digit, value] of Object.entries(options)) {
        if (value && typeof value === 'object') {
          const opt = value as Record<string, unknown>;
          if (typeof opt.label === 'string') {
            parsedOptions[digit] = {
              label: opt.label,
              action:
                opt.action === 'escalate' || opt.action === 'repeat' || opt.action === 'respond'
                  ? opt.action
                  : 'respond',
              response: typeof opt.response === 'string' ? opt.response : undefined,
            };
          }
        }
      }
    }

    result.dtmfMenu = {
      enabled: menu.enabled === true,
      prompt: typeof menu.prompt === 'string' ? menu.prompt : undefined,
      options: parsedOptions,
    };
  }

  return result;
}

export function resolveAgentConfig(agent: {
  interruptionEnabled: boolean;
  maxSilenceSeconds: number;
  voiceProfile: unknown;
  greetingScript: unknown;
  llmConfig: unknown;
  toolsEnabled: unknown;
}): ResolvedAgentConfig {
  return {
    interruptionEnabled: agent.interruptionEnabled,
    maxSilenceSeconds: agent.maxSilenceSeconds,
    llmConfig: parseLlmConfig(agent.llmConfig),
    toolsConfig: parseToolsConfig(agent.toolsEnabled),
    voiceProfile: parseVoiceProfile(agent.voiceProfile),
    greetingScript: parseGreetingScript(agent.greetingScript),
  };
}

export function resolveTtsVoice(
  voiceProfile: VoiceProfile,
  language: string | null,
): OpenAI.Audio.SpeechCreateParams['voice'] {
  const candidates = [
    language ? voiceProfile[language] : undefined,
    voiceProfile.default,
    'alloy',
  ];

  for (const voice of candidates) {
    if (voice) {
      return voice as OpenAI.Audio.SpeechCreateParams['voice'];
    }
  }

  return 'alloy';
}

const ESCALATION_PATTERNS = [
  /\b(speak to|talk to|connect me|transfer me)\b.*\b(human|agent|person|representative|manager)\b/i,
  /\b(human|real person|live agent)\b/i,
  /\b(escalat(e|ion)|handoff|hand off)\b/i,
];

export function detectEscalationIntent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  return ESCALATION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

const LANGUAGE_HINTS: Array<{ code: string; pattern: RegExp }> = [
  { code: 'hi', pattern: /[\u0900-\u097F]/ },
  { code: 'ta', pattern: /[\u0B80-\u0BFF]/ },
  { code: 'te', pattern: /[\u0C00-\u0C7F]/ },
  { code: 'kn', pattern: /[\u0C80-\u0CFF]/ },
  { code: 'ml', pattern: /[\u0D00-\u0D7F]/ },
  { code: 'bn', pattern: /[\u0980-\u09FF]/ },
  { code: 'gu', pattern: /[\u0A80-\u0AFF]/ },
  { code: 'mr', pattern: /[\u0900-\u097F]/ },
];

export function detectLanguageFromText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  for (const hint of LANGUAGE_HINTS) {
    if (hint.pattern.test(trimmed)) {
      return hint.code;
    }
  }

  if (/^[a-zA-Z0-9\s.,!?'"-]+$/.test(trimmed)) {
    return 'en';
  }

  return null;
}
