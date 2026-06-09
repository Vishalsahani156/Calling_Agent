import { z } from 'zod';

export const analyticsCallsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  campaignId: z.string().uuid().optional(),
});

export type AnalyticsCallsQuery = z.infer<typeof analyticsCallsQuerySchema>;
