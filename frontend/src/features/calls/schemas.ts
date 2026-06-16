import { z } from 'zod';

export const listCallsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  campaignId: z.string().uuid().optional(),
});

export const testCallSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number').max(20),
  aiAgentId: z.string().uuid(),
});

export type ListCallsQuery = z.infer<typeof listCallsQuerySchema>;
export type TestCallInput = z.infer<typeof testCallSchema>;
