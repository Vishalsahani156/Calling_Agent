import { prisma } from '../../config/database';

export class SettingsRepository {
  findByOrganization(organizationId: string) {
    return prisma.settings.findUnique({ where: { organizationId } });
  }

  update(organizationId: string, data: Record<string, unknown>) {
    return prisma.settings.update({
      where: { organizationId },
      data,
    });
  }
}

export const settingsRepository = new SettingsRepository();
