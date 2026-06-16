import { z } from 'zod';

const retryPolicySchema = z
  .object({
    maxAttempts: z.number().int().min(1).max(10).optional(),
    retryDelayMinutes: z.number().int().min(1).max(1440).optional(),
  })
  .optional();

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  aiAgentId: z.string().uuid(),
  knowledgeBaseId: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.string().uuid().optional(),
  ),
  callerPhone: z.string().min(10).max(20),
  exotelFlowUrl: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.string().url().max(1000).optional(),
  ),
  scheduleStart: z.string().datetime().optional(),
  scheduleEnd: z.string().datetime().optional(),
  timezone: z.string().max(50).optional(),
  maxConcurrentCalls: z.number().int().min(1).max(50).optional(),
  retryPolicy: retryPolicySchema,
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const campaignIdParamSchema = z.object({ id: z.string().uuid() });

export const listCampaignsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z
    .enum(['draft', 'scheduled', 'running', 'paused', 'stopped', 'completed'])
    .optional(),
  search: z.string().optional(),
});

export const importContactsSchema = z
  .object({
    contactIds: z.array(z.string().uuid()).min(1).optional(),
    groupId: z.string().uuid().optional(),
    filePath: z.string().max(1000).optional(),
  })
  .refine((data) => data.contactIds || data.groupId || data.filePath, {
    message: 'Provide contactIds, groupId, or filePath',
  });
