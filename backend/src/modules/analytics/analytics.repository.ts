import { AnalyticsRollupGranularity, CallStatus, CampaignStatus, Prisma } from '@prisma/client';
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

  async upsertRollup(data: {
    organizationId: string;
    campaignId: string | null;
    periodStart: Date;
    periodEnd: Date;
    metrics: Record<string, unknown>;
    granularity?: AnalyticsRollupGranularity;
  }) {
    const granularity = data.granularity ?? AnalyticsRollupGranularity.day;

    const existing = await prisma.analyticsRollup.findFirst({
      where: {
        organizationId: data.organizationId,
        campaignId: data.campaignId,
        periodStart: data.periodStart,
        granularity,
      },
    });

    if (existing) {
      return prisma.analyticsRollup.update({
        where: { id: existing.id },
        data: {
          periodEnd: data.periodEnd,
          metrics: data.metrics as Prisma.InputJsonValue,
        },
      });
    }

    return prisma.analyticsRollup.create({
      data: {
        organizationId: data.organizationId,
        campaignId: data.campaignId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        granularity,
        metrics: data.metrics as Prisma.InputJsonValue,
      },
    });
  }

  findRollup(
    organizationId: string,
    periodStart: Date,
    campaignId?: string | null,
  ) {
    return prisma.analyticsRollup.findFirst({
      where: {
        organizationId,
        campaignId: campaignId ?? null,
        periodStart,
        granularity: AnalyticsRollupGranularity.day,
      },
    });
  }

  findLatestOrganizationRollup(organizationId: string) {
    return prisma.analyticsRollup.findFirst({
      where: {
        organizationId,
        campaignId: null,
      },
      orderBy: { periodStart: 'desc' },
    });
  }
}

export const analyticsRepository = new AnalyticsRepository();
