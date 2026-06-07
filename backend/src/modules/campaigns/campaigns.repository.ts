import { CampaignStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

const campaignInclude = {
  aiAgent: { select: { id: true, name: true } },
  knowledgeBase: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  _count: { select: { contacts: true, calls: true } },
} satisfies Prisma.CampaignInclude;

export class CampaignsRepository {
  findMany(
    organizationId: string,
    skip: number,
    limit: number,
    filters?: { status?: CampaignStatus; search?: string },
  ) {
    return prisma.campaign.findMany({
      where: {
        organizationId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.search
          ? { name: { contains: filters.search, mode: 'insensitive' } }
          : {}),
      },
      include: campaignInclude,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  count(organizationId: string, filters?: { status?: CampaignStatus; search?: string }) {
    return prisma.campaign.count({
      where: {
        organizationId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.search
          ? { name: { contains: filters.search, mode: 'insensitive' } }
          : {}),
      },
    });
  }

  findById(id: string, organizationId: string) {
    return prisma.campaign.findFirst({
      where: { id, organizationId },
      include: campaignInclude,
    });
  }

  create(data: Prisma.CampaignCreateInput) {
    return prisma.campaign.create({
      data,
      include: campaignInclude,
    });
  }

  update(id: string, organizationId: string, data: Prisma.CampaignUpdateInput) {
    return prisma.campaign.update({
      where: { id, organizationId },
      data,
      include: campaignInclude,
    });
  }

  delete(id: string, organizationId: string) {
    return prisma.campaign.delete({
      where: { id, organizationId },
    });
  }

  updateStatus(id: string, organizationId: string, status: CampaignStatus) {
    return prisma.campaign.update({
      where: { id, organizationId },
      data: { status },
      include: campaignInclude,
    });
  }

  attachContacts(campaignId: string, contactIds: string[]) {
    return prisma.campaignContact.createMany({
      data: contactIds.map((contactId) => ({ campaignId, contactId })),
      skipDuplicates: true,
    });
  }

  findGroupContactIds(groupId: string, organizationId: string) {
    return prisma.contactGroupMap.findMany({
      where: { groupId, contact: { organizationId } },
      select: { contactId: true },
    });
  }

  countContactsByStatus(campaignId: string) {
    return prisma.campaignContact.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { status: true },
    });
  }

  countCallsByStatus(campaignId: string) {
    return prisma.call.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { status: true },
    });
  }
}

export const campaignsRepository = new CampaignsRepository();
