export type CreateAgentInput = {
  name: string;
  voiceProfile?: Record<string, unknown>;
  personalityPrompt: string;
  greetingScript?: Record<string, string>;
  interruptionEnabled?: boolean;
  maxSilenceSeconds?: number;
  llmConfig?: Record<string, unknown>;
  toolsEnabled?: Record<string, unknown>;
};

export type UpdateAgentInput = {
  name?: string;
  voiceProfile?: Record<string, unknown>;
  personalityPrompt?: string;
  greetingScript?: Record<string, string>;
  interruptionEnabled?: boolean;
  maxSilenceSeconds?: number;
  llmConfig?: Record<string, unknown>;
  toolsEnabled?: Record<string, unknown>;
};

export type TestAgentInput = {
  message: string;
  knowledgeBaseId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
};
