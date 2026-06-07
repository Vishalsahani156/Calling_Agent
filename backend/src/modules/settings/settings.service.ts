import { settingsRepository } from './settings.repository';
import { NotFoundError } from '../../shared/errors/app.error';

export class SettingsService {
  async get(organizationId: string) {
    const settings = await settingsRepository.findByOrganization(organizationId);
    if (!settings) throw new NotFoundError('Settings not found');
    return settings;
  }

  async update(organizationId: string, input: Record<string, unknown>) {
    return settingsRepository.update(organizationId, input);
  }
}

export const settingsService = new SettingsService();
