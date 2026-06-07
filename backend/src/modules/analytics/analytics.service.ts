import { CallStatus, CampaignStatus } from '@prisma/client';
import { analyticsRepository } from './analytics.repository';
import { NotFoundError } from '../../shared/errors/app.error';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export class AnalyticsService {
  async getOverview(organizationId: string) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [
      totalCampaigns,
      runningCampaigns,
      totalCalls,
      callsToday,
      liveCalls,
      completedCalls,
    ] = await Promise.all([
      analyticsRepository.countCampaigns(organizationId),
      analyticsRepository.countCampaigns(organizationId, CampaignStatus.running),
      analyticsRepository.countCalls(organizationId),
      analyticsRepository.countCalls(organizationId, {
        from: todayStart,
        to: todayEnd,
      }),
      analyticsRepository.countCalls(organizationId, { status: CallStatus.in_progress }),
      analyticsRepository.countCalls(organizationId, { status: CallStatus.completed }),
    ]);

    const completionRate = totalCalls > 0 ? completedCalls / totalCalls : 0;

    return {
      campaigns: {
        total: totalCampaigns,
        running: runningCampaigns,
      },
      calls: {
        total: totalCalls,
        today: callsToday,
        live: liveCalls,
        completed: completedCalls,
        completionRate,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getCallStats(
    organizationId: string,
    query: { from?: string; to?: string; campaignId?: string },
  ) {
    const from = query.from ? new Date(query.from) : startOfDay(new Date(Date.now() - 6 * 86400000));
    const to = query.to ? new Date(query.to) : endOfDay(new Date());

    const [byStatus, durationAgg, dailyCounts] = await Promise.all([
      analyticsRepository.groupCallsByStatus(organizationId, {
        from,
        to,
        campaignId: query.campaignId,
      }),
      analyticsRepository.aggregateCallDuration(organizationId, {
        from,
        to,
        campaignId: query.campaignId,
      }),
      analyticsRepository.countCallsByDay(organizationId, from, to, query.campaignId),
    ]);

    const total = byStatus.reduce((sum, row) => sum + row._count.status, 0);
    const completed = byStatus.find((r) => r.status === CallStatus.completed)?._count.status ?? 0;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      campaignId: query.campaignId ?? null,
      totals: {
        calls: total,
        completed,
        completionRate: total > 0 ? completed / total : 0,
        avgDurationSeconds: durationAgg._avg.durationSeconds ?? 0,
        totalDurationSeconds: durationAgg._sum.durationSeconds ?? 0,
      },
      byStatus: Object.fromEntries(
        byStatus.map((row) => [
          row.status,
          {
            count: row._count.status,
            avgDurationSeconds: row._avg.durationSeconds ?? 0,
          },
        ]),
      ),
      daily: dailyCounts.map((row) => ({
        date: row.day.toISOString().slice(0, 10),
        count: Number(row.count),
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async getCampaignStats(campaignId: string, organizationId: string) {
    const campaign = await analyticsRepository.findCampaign(campaignId, organizationId);
    if (!campaign) throw new NotFoundError('Campaign not found');

    const [callStats, contactStats, durationAgg] = await Promise.all([
      analyticsRepository.groupCallsByStatus(organizationId, { campaignId }),
      analyticsRepository.groupCampaignContactsByStatus(campaignId, organizationId),
      analyticsRepository.aggregateCallDuration(organizationId, { campaignId }),
    ]);

    const totalCalls = callStats.reduce((sum, row) => sum + row._count.status, 0);
    const completedCalls =
      callStats.find((r) => r.status === CallStatus.completed)?._count.status ?? 0;
    const totalContacts = contactStats.reduce((sum, row) => sum + row._count.status, 0);
    const completedContacts =
      contactStats.find((r) => r.status === 'completed')?._count.status ?? 0;

    return {
      campaign,
      calls: {
        total: totalCalls,
        completed: completedCalls,
        connectionRate: totalCalls > 0 ? completedCalls / totalCalls : 0,
        avgDurationSeconds: durationAgg._avg.durationSeconds ?? 0,
        byStatus: Object.fromEntries(
          callStats.map((row) => [row.status, row._count.status]),
        ),
      },
      contacts: {
        total: totalContacts,
        completed: completedContacts,
        completionRate: totalContacts > 0 ? completedContacts / totalContacts : 0,
        byStatus: Object.fromEntries(
          contactStats.map((row) => [row.status, row._count.status]),
        ),
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

export const analyticsService = new AnalyticsService();
