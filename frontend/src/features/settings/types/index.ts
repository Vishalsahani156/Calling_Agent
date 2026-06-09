export type { UpdateSettingsInput } from '@/features/settings/schemas';

export interface Settings {
  id: string;
  organizationId: string;
  exotelConfig: Record<string, unknown>;
  defaultCallerId: string | null;
  notificationPrefs: Record<string, boolean>;
  retentionDays: number;
  featureFlags: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}
