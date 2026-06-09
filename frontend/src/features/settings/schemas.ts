import { z } from 'zod';

export const updateSettingsSchema = z.object({
  defaultCallerId: z.string().max(20).optional(),
  exotelConfig: z.record(z.unknown()).optional(),
  notificationPrefs: z.record(z.boolean()).optional(),
  retentionDays: z.number().int().min(7).max(365).optional(),
  featureFlags: z.record(z.boolean()).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const NOTIFICATION_PREF_KEYS = [
  'campaignCompleted',
  'callFailed',
  'weeklyReport',
] as const;

export const FEATURE_FLAG_KEYS = ['voiceAgent', 'analytics', 'csvImport'] as const;

export const EXOTEL_CONFIG_KEYS = ['accountSid', 'apiKey', 'apiToken', 'subdomain'] as const;
