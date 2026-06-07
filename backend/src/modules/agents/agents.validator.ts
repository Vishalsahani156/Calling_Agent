import { z } from 'zod';

const jsonRecordSchema = z.record(z.unknown()).optional();

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

export const agentIdParamSchema = z.object({ id: z.string().uuid() });

export const listAgentsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export const testAgentSchema = z.object({
  message: z.string().min(1).max(4000),
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
