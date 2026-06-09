import { apiGet, apiPatch } from '@/lib/api-client';
import type { UpdateSettingsInput } from '@/features/settings/schemas';
import type { Settings } from '@/features/settings/types';

export async function fetchSettings(): Promise<Settings> {
  return apiGet<Settings>('/settings');
}

export async function updateSettings(input: UpdateSettingsInput): Promise<Settings> {
  return apiPatch<Settings, UpdateSettingsInput>('/settings', input);
}
