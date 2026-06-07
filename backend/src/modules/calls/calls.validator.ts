import { z } from 'zod';

export const callIdParamSchema = z.object({ id: z.string().uuid() });

export const listCallsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z
    .enum([
      'initiated',
      'ringing',
      'in_progress',
      'completed',
      'failed',
      'busy',
      'no_answer',
      'canceled',
    ])
    .optional(),
  campaignId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
