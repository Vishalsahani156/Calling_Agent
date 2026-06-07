import { prisma } from '../../config/database';
import { analyticsRepository } from './analytics.repository';

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1_000 - 1);
}

async function buildOrganizationMetrics(
  organizationId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const [totalCalls, completedCalls, liveCalls, byStatus, durationAgg, dailyCounts] =
    await Promise.all([
      analyticsRepository.countCalls(organizationId, { from: periodStart, to: periodEnd }),
      analyticsRepository.countCalls(organizationId, {
        from: periodStart,
        to: periodEnd,
        status: 'completed',
      }),
      analyticsRepository.countCalls(organizationId, { status: 'in_progress' }),
      analyticsRepository.groupCallsByStatus(organizationId, {
        from: periodStart,
        to: periodEnd,
      }),
      analyticsRepository.aggregateCallDuration(organizationId, {
        from: periodStart,
        to: periodEnd,
      }),
      analyticsRepository.countCallsByDay(organizationId, periodStart, periodEnd),
    ]);

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    calls: {
      total: totalCalls,
      completed: completedCalls,
      live: liveCalls,
      byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count.status])),
      avgDurationSeconds: durationAgg._avg.durationSeconds ?? 0,
      totalDurationSeconds: durationAgg._sum.durationSeconds ?? 0,
    },
    dailyCounts: dailyCounts.map((row) => ({
      day: row.day.toISOString(),
      count: Number(row.count),
    })),
    generatedAt: new Date().toISOString(),
  };
}

async function buildCampaignMetrics(
  organizationId: string,
  campaignId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const [callStats, contactStats, durationAgg] = await Promise.all([
    analyticsRepository.groupCallsByStatus(organizationId, {
      campaignId,
      from: periodStart,
      to: periodEnd,
    }),
    analyticsRepository.groupCampaignContactsByStatus(campaignId, organizationId),
    analyticsRepository.aggregateCallDuration(organizationId, {
      campaignId,
      from: periodStart,
      to: periodEnd,
    }),
  ]);

  const totalCalls = callStats.reduce((sum, row) => sum + row._count.status, 0);
  const completedCalls = callStats.find((row) => row.status === 'completed')?._count.status ?? 0;

  return {
    campaignId,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    calls: {
      total: totalCalls,
      completed: completedCalls,
      byStatus: Object.fromEntries(callStats.map((row) => [row.status, row._count.status])),
      avgDurationSeconds: durationAgg._avg.durationSeconds ?? 0,
      connectionRate: totalCalls > 0 ? completedCalls / totalCalls : 0,
    },
    contacts: {
      byStatus: Object.fromEntries(contactStats.map((row) => [row.status, row._count.status])),
    },
    generatedAt: new Date().toISOString(),
  };
}

export class AnalyticsRollupService {
  async runRollup(params?: {
    organizationId?: string;
    periodStart?: Date;
    periodEnd?: Date;
  }): Promise<{ organizationsProcessed: number; rollupsWritten: number }> {
    const targetDay = params?.periodStart ?? new Date(Date.now() - 24 * 60 * 60 * 1_000);
    const periodStart = startOfUtcDay(targetDay);
    const periodEnd = params?.periodEnd ?? endOfUtcDay(targetDay);

    const organizations = params?.organizationId
      ? [{ id: params.organizationId }]
      : await prisma.organization.findMany({ select: { id: true } });

    let rollupsWritten = 0;

    for (const organization of organizations) {
      const orgMetrics = await buildOrganizationMetrics(organization.id, periodStart, periodEnd);
      await analyticsRepository.upsertRollup({
        organizationId: organization.id,
        campaignId: null,
        periodStart,
        periodEnd,
        metrics: orgMetrics,
      });
      rollupsWritten += 1;

      const campaigns = await prisma.campaign.findMany({
        where: { organizationId: organization.id },
        select: { id: true },
      });

      for (const campaign of campaigns) {
        const campaignMetrics = await buildCampaignMetrics(
          organization.id,
          campaign.id,
          periodStart,
          periodEnd,
        );

        await analyticsRepository.upsertRollup({
          organizationId: organization.id,
          campaignId: campaign.id,
          periodStart,
          periodEnd,
          metrics: campaignMetrics,
        });
        rollupsWritten += 1;
      }
    }

    return {
      organizationsProcessed: organizations.length,
      rollupsWritten,
    };
  }
}

export const analyticsRollupService = new AnalyticsRollupService();
