import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

const CONTACT_INCLUDE = {
  tagMaps: { include: { tag: true } },
  groupMaps: { include: { group: true } },
  notes: {
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.ContactInclude;

const LIST_INCLUDE = {
  tagMaps: { include: { tag: true } },
  groupMaps: { include: { group: true } },
} satisfies Prisma.ContactInclude;

export interface ContactListFilters {
  search?: string;
  tagId?: string;
  groupId?: string;
  optOut?: boolean;
}

export interface ContactImportRow {
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  metadata?: Prisma.InputJsonValue;
  optOut?: boolean;
}

function buildContactWhere(
  organizationId: string,
  filters: ContactListFilters = {},
): Prisma.ContactWhereInput {
  return {
    organizationId,
    ...(filters.optOut !== undefined ? { optOut: filters.optOut } : {}),
    ...(filters.tagId
      ? { tagMaps: { some: { tagId: filters.tagId } } }
      : {}),
    ...(filters.groupId
      ? { groupMaps: { some: { groupId: filters.groupId } } }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { phone: { contains: filters.search } },
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

export class ContactsRepository {
  findMany(organizationId: string, skip: number, limit: number, filters?: ContactListFilters) {
    return prisma.contact.findMany({
      where: buildContactWhere(organizationId, filters),
      include: LIST_INCLUDE,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  count(organizationId: string, filters?: ContactListFilters) {
    return prisma.contact.count({
      where: buildContactWhere(organizationId, filters),
    });
  }

  findAllForExport(organizationId: string, filters?: ContactListFilters) {
    return prisma.contact.findMany({
      where: buildContactWhere(organizationId, filters),
      include: LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string, organizationId: string) {
    return prisma.contact.findFirst({
      where: { id, organizationId },
      include: CONTACT_INCLUDE,
    });
  }

  findByPhone(organizationId: string, phone: string) {
    return prisma.contact.findUnique({
      where: { organizationId_phone: { organizationId, phone } },
    });
  }

  create(data: Prisma.ContactCreateInput) {
    return prisma.contact.create({
      data,
      include: CONTACT_INCLUDE,
    });
  }

  update(id: string, data: Prisma.ContactUpdateInput) {
    return prisma.contact.update({
      where: { id },
      data,
      include: CONTACT_INCLUDE,
    });
  }

  delete(id: string) {
    return prisma.contact.delete({
      where: { id },
    });
  }

  async importBatchCreate(
    organizationId: string,
    rows: ContactImportRow[],
    skipDuplicates: boolean,
  ): Promise<number> {
    const BATCH_SIZE = 1000;
    let imported = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const result = await prisma.contact.createMany({
        data: batch.map((row) => ({
          organizationId,
          phone: row.phone,
          firstName: row.firstName ?? null,
          lastName: row.lastName ?? null,
          email: row.email ?? null,
          metadata: row.metadata ?? {},
          optOut: row.optOut ?? false,
        })),
        skipDuplicates,
      });
      imported += result.count;
    }

    return imported;
  }

  findTagsByNames(organizationId: string, names: string[]) {
    return prisma.contactTag.findMany({
      where: {
        organizationId,
        name: { in: names },
      },
    });
  }

  createTags(organizationId: string, names: string[]) {
    return prisma.contactTag.createMany({
      data: names.map((name) => ({ organizationId, name })),
      skipDuplicates: true,
    });
  }

  async findOrCreateTags(organizationId: string, names: string[]) {
    const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
    if (uniqueNames.length === 0) return [];

    await this.createTags(organizationId, uniqueNames);
    return this.findTagsByNames(organizationId, uniqueNames);
  }

  addTagsToContact(contactId: string, tagIds: string[]) {
    return prisma.contactTagMap.createMany({
      data: tagIds.map((tagId) => ({ contactId, tagId })),
      skipDuplicates: true,
    });
  }

  addContactToGroups(contactId: string, groupIds: string[]) {
    return prisma.contactGroupMap.createMany({
      data: groupIds.map((groupId) => ({ contactId, groupId })),
      skipDuplicates: true,
    });
  }

  findGroupsByIds(organizationId: string, groupIds: string[]) {
    return prisma.contactGroup.findMany({
      where: { organizationId, id: { in: groupIds } },
    });
  }

  createNote(contactId: string, authorId: string, note: string) {
    return prisma.contactNote.create({
      data: { contactId, authorId, note },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  findGroups(organizationId: string, skip: number, limit: number, search?: string) {
    return prisma.contactGroup.findMany({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  countGroups(organizationId: string, search?: string) {
    return prisma.contactGroup.count({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  createGroup(
    organizationId: string,
    data: { name: string; description?: string | null },
  ) {
    return prisma.contactGroup.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description ?? null,
      },
    });
  }
}

export const contactsRepository = new ContactsRepository();
