import { z } from 'zod';

const jsonRecordSchema = z.record(z.unknown()).optional();

export const listAgentsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export const createAgentSchema = z.object({
  name: z.string().min(1).max(200),
  voiceProfile: jsonRecordSchema,
  personalityPrompt: z.string().min(1),
  greetingScript: z.record(z.string()).optional(),
  interruptionEnabled: z.boolean().optional(),
  maxSilenceSeconds: z.number().int().min(1).max(300).optional(),
  llmConfig: jsonRecordSchema,
  toolsEnabled: jsonRecordSchema,
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  voiceProfile: jsonRecordSchema,
  personalityPrompt: z.string().min(1).optional(),
  greetingScript: z.record(z.string()).optional(),
  interruptionEnabled: z.boolean().optional(),
  maxSilenceSeconds: z.number().int().min(1).max(300).optional(),
  llmConfig: jsonRecordSchema,
  toolsEnabled: jsonRecordSchema,
});

export const testAgentSchema = z.object({
  message: z.string().min(1).max(4000),
  knowledgeBaseId: z.string().uuid().optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .max(50)
    .optional(),
});

const jsonStringSchema = z
  .string()
  .refine((value) => {
    if (!value.trim()) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid JSON')
  .optional();

export const greetingEntrySchema = z.object({
  language: z.string().min(2).max(10),
  text: z.string().min(1),
});

export const agentFormSchema = z.object({
  name: z.string().min(1).max(200),
  personalityPrompt: z.string().min(1),
  greetingEntries: z.array(greetingEntrySchema).min(1),
  voiceProfileJson: jsonStringSchema,
  interruptionEnabled: z.boolean(),
  maxSilenceSeconds: z.coerce.number().int().min(1).max(300),
  llmConfigJson: jsonStringSchema,
  toolsEnabledJson: jsonStringSchema,
});

export type ListAgentsQuery = z.infer<typeof listAgentsQuerySchema>;
export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type TestAgentInput = z.infer<typeof testAgentSchema>;
export type AgentFormValues = z.infer<typeof agentFormSchema>;
export type ConversationMessage = NonNullable<TestAgentInput['conversationHistory']>[number];
