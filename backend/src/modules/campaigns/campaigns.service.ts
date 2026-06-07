import { CampaignStatus } from '@prisma/client';
import { campaignsRepository } from './campaigns.repository';
import {
  CreateCampaignInput,
  ImportContactsInput,
  UpdateCampaignInput,
} from './campaigns.types';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/app.error';
import { getPagination, buildPaginatedMeta } from '../../shared/utils/response';
import { eventBus, AppEvents } from '../../events/event-bus';
import { enqueueCampaignDial, enqueueCsvImport } from '../../jobs/queues';

function formatCampaign(campaign: {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  callerPhone: string;
  exotelFlowUrl: string | null;
  scheduleStart: Date | null;
  scheduleEnd: Date | null;
  timezone: string;
  maxConcurrentCalls: number;
  retryPolicy: unknown;
  createdAt: Date;
  updatedAt: Date;
  aiAgent: { id: string; name: string };
  knowledgeBase: { id: string; name: string } | null;
  createdBy: { id: string; firstName: string; lastName: string; email: string };
  _count: { contacts: number; calls: number };
}) {
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
    callerPhone: campaign.callerPhone,
    exotelFlowUrl: campaign.exotelFlowUrl,
    scheduleStart: campaign.scheduleStart,
    scheduleEnd: campaign.scheduleEnd,
    timezone: campaign.timezone,
    maxConcurrentCalls: campaign.maxConcurrentCalls,
    retryPolicy: campaign.retryPolicy,
    aiAgent: campaign.aiAgent,
    knowledgeBase: campaign.knowledgeBase,
    createdBy: campaign.createdBy,
    contactCount: campaign._count.contacts,
    callCount: campaign._count.calls,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

const STARTABLE_STATUSES: CampaignStatus[] = [
  CampaignStatus.draft,
  CampaignStatus.scheduled,
  CampaignStatus.paused,
  CampaignStatus.stopped,
];

export class CampaignsService {
  async list(
    organizationId: string,
    query: { page?: string; limit?: string; status?: string; search?: string },
  ) {
    const { page, limit, skip } = getPagination(query);
    const filters = {
      status: query.status as CampaignStatus | undefined,
      search: query.search,
    };
    const [campaigns, total] = await Promise.all([
      campaignsRepository.findMany(organizationId, skip, limit, filters),
      campaignsRepository.count(organizationId, filters),
    ]);
    return {
      data: campaigns.map(formatCampaign),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async getById(id: string, organizationId: string) {
    const campaign = await campaignsRepository.findById(id, organizationId);
    if (!campaign) throw new NotFoundError('Campaign not found');
    return formatCampaign(campaign);
  }

  async create(organizationId: string, userId: string, input: CreateCampaignInput) {
    const campaign = await campaignsRepository.create({
      name: input.name,
      description: input.description,
      callerPhone: input.callerPhone,
      exotelFlowUrl: input.exotelFlowUrl,
      scheduleStart: input.scheduleStart ? new Date(input.scheduleStart) : undefined,
      scheduleEnd: input.scheduleEnd ? new Date(input.scheduleEnd) : undefined,
      timezone: input.timezone,
      maxConcurrentCalls: input.maxConcurrentCalls,
      retryPolicy: input.retryPolicy,
      organization: { connect: { id: organizationId } },
      aiAgent: { connect: { id: input.aiAgentId } },
      ...(input.knowledgeBaseId
        ? { knowledgeBase: { connect: { id: input.knowledgeBaseId } } }
        : {}),
      createdBy: { connect: { id: userId } },
    });
    return formatCampaign(campaign);
  }

  async update(id: string, organizationId: string, input: UpdateCampaignInput) {
    const existing = await campaignsRepository.findById(id, organizationId);
    if (!existing) throw new NotFoundError('Campaign not found');

    if (existing.status === CampaignStatus.running) {
      throw new ConflictError('Cannot update a running campaign');
    }

    const campaign = await campaignsRepository.update(id, organizationId, {
      name: input.name,
      description: input.description,
      callerPhone: input.callerPhone,
      exotelFlowUrl: input.exotelFlowUrl,
      scheduleStart: input.scheduleStart ? new Date(input.scheduleStart) : undefined,
      scheduleEnd: input.scheduleEnd ? new Date(input.scheduleEnd) : undefined,
      timezone: input.timezone,
      maxConcurrentCalls: input.maxConcurrentCalls,
      retryPolicy: input.retryPolicy,
      ...(input.aiAgentId ? { aiAgent: { connect: { id: input.aiAgentId } } } : {}),
      ...(input.knowledgeBaseId !== undefined
        ? input.knowledgeBaseId
          ? { knowledgeBase: { connect: { id: input.knowledgeBaseId } } }
          : { knowledgeBase: { disconnect: true } }
        : {}),
    });
    return formatCampaign(campaign);
  }

  async delete(id: string, organizationId: string) {
    const existing = await campaignsRepository.findById(id, organizationId);
    if (!existing) throw new NotFoundError('Campaign not found');

    if (existing.status === CampaignStatus.running) {
      throw new ConflictError('Stop the campaign before deleting');
    }

    await campaignsRepository.delete(id, organizationId);
    return { message: 'Campaign deleted successfully' };
  }

  async start(id: string, organizationId: string) {
    const campaign = await campaignsRepository.findById(id, organizationId);
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (!STARTABLE_STATUSES.includes(campaign.status)) {
      throw new BadRequestError(`Cannot start campaign in ${campaign.status} status`);
    }

    const updated = await campaignsRepository.updateStatus(
      id,
      organizationId,
      CampaignStatus.running,
    );

    eventBus.emit(AppEvents.CAMPAIGN_STARTED, { campaignId: id, organizationId });

    await enqueueCampaignDial({ campaignId: id, organizationId });

    return formatCampaign(updated);
  }

  async pause(id: string, organizationId: string) {
    const campaign = await campaignsRepository.findById(id, organizationId);
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (campaign.status !== CampaignStatus.running) {
      throw new BadRequestError('Only running campaigns can be paused');
    }

    const updated = await campaignsRepository.updateStatus(
      id,
      organizationId,
      CampaignStatus.paused,
    );

    eventBus.emit(AppEvents.CAMPAIGN_PAUSED, { campaignId: id, organizationId });
    return formatCampaign(updated);
  }

  async stop(id: string, organizationId: string) {
    const campaign = await campaignsRepository.findById(id, organizationId);
    if (!campaign) throw new NotFoundError('Campaign not found');

    const stoppableStatuses: CampaignStatus[] = [
      CampaignStatus.running,
      CampaignStatus.paused,
    ];
    if (!stoppableStatuses.includes(campaign.status)) {
      throw new BadRequestError('Only running or paused campaigns can be stopped');
    }

    const updated = await campaignsRepository.updateStatus(
      id,
      organizationId,
      CampaignStatus.stopped,
    );

    eventBus.emit(AppEvents.CAMPAIGN_STOPPED, { campaignId: id, organizationId });
    return formatCampaign(updated);
  }

  async importContacts(
    id: string,
    organizationId: string,
    importedById: string,
    input: ImportContactsInput,
  ) {
    const campaign = await campaignsRepository.findById(id, organizationId);
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (input.filePath) {
      const jobId = await enqueueCsvImport({
        organizationId,
        campaignId: id,
        filePath: input.filePath,
        importedById,
      });
      return {
        message: 'Contact import queued',
        jobId,
        campaignId: id,
      };
    }

    let contactIds = input.contactIds ?? [];

    if (input.groupId) {
      const groupContacts = await campaignsRepository.findGroupContactIds(
        input.groupId,
        organizationId,
      );
      contactIds = [...new Set([...contactIds, ...groupContacts.map((c) => c.contactId)])];
    }

    if (contactIds.length === 0) {
      throw new BadRequestError('No contacts to import');
    }

    const result = await campaignsRepository.attachContacts(id, contactIds);
    return {
      message: 'Contacts attached to campaign',
      campaignId: id,
      attached: result.count,
    };
  }

  async getAnalytics(id: string, organizationId: string) {
    const campaign = await campaignsRepository.findById(id, organizationId);
    if (!campaign) throw new NotFoundError('Campaign not found');

    const [contactStats, callStats] = await Promise.all([
      campaignsRepository.countContactsByStatus(id),
      campaignsRepository.countCallsByStatus(id),
    ]);

    const totalContacts = contactStats.reduce((sum, s) => sum + s._count.status, 0);
    const completedContacts =
      contactStats.find((s) => s.status === 'completed')?._count.status ?? 0;
    const totalCalls = callStats.reduce((sum, s) => sum + s._count.status, 0);
    const connectedCalls =
      callStats.find((s) => s.status === 'completed')?._count.status ?? 0;

    return {
      campaignId: id,
      status: campaign.status,
      contacts: {
        total: totalContacts,
        byStatus: Object.fromEntries(
          contactStats.map((s) => [s.status, s._count.status]),
        ),
        completionRate: totalContacts > 0 ? completedContacts / totalContacts : 0,
      },
      calls: {
        total: totalCalls,
        byStatus: Object.fromEntries(callStats.map((s) => [s.status, s._count.status])),
        connectionRate: totalCalls > 0 ? connectedCalls / totalCalls : 0,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getReport(id: string, organizationId: string) {
    const analytics = await this.getAnalytics(id, organizationId);
    const campaign = await campaignsRepository.findById(id, organizationId);
    if (!campaign) throw new NotFoundError('Campaign not found');

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        startedAt: campaign.scheduleStart,
        endedAt: campaign.scheduleEnd,
      },
      summary: analytics,
      sections: {
        performance: analytics,
        disposition: { stub: true, message: 'Disposition breakdown available in post-MVP' },
        timeline: { stub: true, message: 'Hourly timeline available in post-MVP' },
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

export const campaignsService = new CampaignsService();
