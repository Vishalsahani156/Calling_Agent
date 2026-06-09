import type { CreateAgentInput, UpdateAgentInput } from '@/features/agents/schemas';

export interface Agent {
  id: string;
  name: string;
  voiceProfile: Record<string, unknown> | null;
  personalityPrompt: string;
  greetingScript: Record<string, string> | null;
  interruptionEnabled: boolean;
  maxSilenceSeconds: number;
  llmConfig: Record<string, unknown> | null;
  toolsEnabled: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestAgentResult {
  mock?: boolean;
  message?: string;
  simulatedResponse?: string;
  agent: { id: string; name: string };
  response?: string;
  input?: { message: string };
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  rag?: {
    knowledgeBaseId?: string;
    faqMatch?: boolean;
    chunksUsed?: number;
  };
}

export type { CreateAgentInput, UpdateAgentInput };
