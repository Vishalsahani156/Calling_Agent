import { z } from 'zod';

export const updateSettingsSchema = z.object({
  defaultCallerId: z.string().max(20).optional(),
  exotelConfig: z.record(z.unknown()).optional(),
  notificationPrefs: z.record(z.boolean()).optional(),
  retentionDays: z.number().int().min(7).max(365).optional(),
  featureFlags: z.record(z.boolean()).optional(),
});
