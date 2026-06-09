import type { AgentFormValues } from '@/features/agents/schemas';
import type { Agent } from '@/features/agents/types';
import type { CreateAgentInput, UpdateAgentInput } from '@/features/agents/schemas';

export function stringifyJson(value: unknown, fallback = '{}'): string {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return fallback;
  }
}

export function parseJsonRecord(value: string | undefined): Record<string, unknown> | undefined {
  if (!value?.trim()) return undefined;
  const parsed = JSON.parse(value) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('JSON must be an object');
  }
  return parsed as Record<string, unknown>;
}

export function greetingRecordToEntries(
  record?: Record<string, string> | null,
): { language: string; text: string }[] {
  if (!record || Object.keys(record).length === 0) {
    return [{ language: 'en', text: 'Hello! How can I help you today?' }];
  }
  return Object.entries(record).map(([language, text]) => ({ language, text }));
}

export function entriesToGreetingRecord(
  entries: { language: string; text: string }[],
): Record<string, string> {
  return Object.fromEntries(
    entries
      .filter((entry) => entry.language.trim() && entry.text.trim())
      .map((entry) => [entry.language.trim(), entry.text.trim()]),
  );
}

export function agentToFormValues(agent?: Agent): AgentFormValues {
  return {
    name: agent?.name ?? '',
    personalityPrompt: agent?.personalityPrompt ?? '',
    greetingEntries: greetingRecordToEntries(agent?.greetingScript),
    voiceProfileJson: stringifyJson(agent?.voiceProfile ?? {}),
    interruptionEnabled: agent?.interruptionEnabled ?? true,
    maxSilenceSeconds: agent?.maxSilenceSeconds ?? 15,
    llmConfigJson: stringifyJson(agent?.llmConfig ?? { model: 'gpt-4o-mini', temperature: 0.7 }),
    toolsEnabledJson: stringifyJson(agent?.toolsEnabled ?? {}),
  };
}

export function formValuesToCreateInput(values: AgentFormValues): CreateAgentInput {
  return {
    name: values.name,
    personalityPrompt: values.personalityPrompt,
    greetingScript: entriesToGreetingRecord(values.greetingEntries),
    voiceProfile: parseJsonRecord(values.voiceProfileJson),
    interruptionEnabled: values.interruptionEnabled,
    maxSilenceSeconds: values.maxSilenceSeconds,
    llmConfig: parseJsonRecord(values.llmConfigJson),
    toolsEnabled: parseJsonRecord(values.toolsEnabledJson),
  };
}

export function formValuesToUpdateInput(values: AgentFormValues): UpdateAgentInput {
  return formValuesToCreateInput(values);
}
