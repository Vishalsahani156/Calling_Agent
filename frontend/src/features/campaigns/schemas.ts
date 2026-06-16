import { z } from 'zod';

export const listCampaignsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(5000).optional(),
  aiAgentId: z.string().uuid('Select an agent'),
  knowledgeBaseId: z.string().uuid().optional(),
  callerPhone: z.string().min(10, 'Caller ID is required').max(20),
  exotelFlowUrl: z.string().url().max(1000).optional().or(z.literal('')),
  maxConcurrentCalls: z.coerce.number().int().min(1).max(50).optional(),
});

export const importCampaignContactsSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1, 'Select at least one contact'),
});

export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type ImportCampaignContactsInput = z.infer<typeof importCampaignContactsSchema>;
