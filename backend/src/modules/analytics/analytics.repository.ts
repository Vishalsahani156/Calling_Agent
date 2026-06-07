import { CallStatus, CampaignStatus } from '@prisma/client';
import { prisma } from '../../config/database';

export class AnalyticsRepository {
  countCampaigns(organizationId: string, status?: CampaignStatus) {
    return prisma.campaign.count({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
    });
  }

  countCalls(
    organizationId: string,
    filters?: { from?: Date; to?: Date; campaignId?: string; status?: CallStatus },
  ) {
    return prisma.call.count({
      where: {
        organizationId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters?.from || filters?.to
          ? {
              startedAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
    });
  }

  groupCallsByStatus(
    organizationId: string,
    filters?: { from?: Date; to?: Date; campaignId?: string },
  ) {
    return prisma.call.groupBy({
      by: ['status'],
      where: {
        organizationId,
        ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters?.from || filters?.to
          ? {
              startedAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      _count: { status: true },
      _avg: { durationSeconds: true },
    });
  }

  aggregateCallDuration(
    organizationId: string,
    filters?: { from?: Date; to?: Date; campaignId?: string },
  ) {
    return prisma.call.aggregate({
      where: {
        organizationId,
        durationSeconds: { not: null },
        ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters?.from || filters?.to
          ? {
              startedAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      _avg: { durationSeconds: true },
      _sum: { durationSeconds: true },
      _count: { id: true },
    });
  }

  groupCampaignContactsByStatus(campaignId: string, organizationId: string) {
    return prisma.campaignContact.groupBy({
      by: ['status'],
      where: { campaignId, campaign: { organizationId } },
      _count: { status: true },
    });
  }

  findCampaign(id: string, organizationId: string) {
    return prisma.campaign.findFirst({
      where: { id, organizationId },
      select: { id: true, name: true, status: true, createdAt: true },
    });
  }

  countCallsByDay(
    organizationId: string,
    from: Date,
    to: Date,
    campaignId?: string,
  ): Promise<Array<{ day: Date; count: bigint }>> {
    if (campaignId) {
      return prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', started_at) AS day, COUNT(*)::bigint AS count
        FROM calls
        WHERE organization_id = ${organizationId}::uuid
          AND started_at >= ${from}
          AND started_at <= ${to}
          AND campaign_id = ${campaignId}::uuid
        GROUP BY DATE_TRUNC('day', started_at)
        ORDER BY day ASC
      `;
    }

    return prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT DATE_TRUNC('day', started_at) AS day, COUNT(*)::bigint AS count
      FROM calls
      WHERE organization_id = ${organizationId}::uuid
        AND started_at >= ${from}
        AND started_at <= ${to}
      GROUP BY DATE_TRUNC('day', started_at)
      ORDER BY day ASC
    `;
  }
}

export const analyticsRepository = new AnalyticsRepository();
