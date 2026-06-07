import { parse } from 'csv-parse/sync';
import { Prisma } from '@prisma/client';
import { contactsRepository } from './contacts.repository';
import {
  CreateContactInput,
  CreateGroupInput,
  CreateNoteInput,
  CreateTagInput,
  UpdateContactInput,
} from './contacts.validator';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../shared/errors/app.error';
import { getPagination, buildPaginatedMeta } from '../../shared/utils/response';
import { eventBus, AppEvents } from '../../events/event-bus';

type ContactWithRelations = Prisma.ContactGetPayload<{
  include: {
    tagMaps: { include: { tag: true } };
    groupMaps: { include: { group: true } };
    notes: {
      include: {
        author: { select: { id: true; firstName: true; lastName: true; email: true } };
      };
    };
  };
}>;

type ContactListItem = Prisma.ContactGetPayload<{
  include: {
    tagMaps: { include: { tag: true } };
    groupMaps: { include: { group: true } };
  };
}>;

function formatNote(note: ContactWithRelations['notes'][number]) {
  return {
    id: note.id,
    note: note.note,
    author: note.author,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function formatContact(contact: ContactListItem | ContactWithRelations) {
  return {
    id: contact.id,
    phone: contact.phone,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    metadata: contact.metadata,
    optOut: contact.optOut,
    tags: contact.tagMaps.map((map) => map.tag),
    groups: contact.groupMaps.map((map) => map.group),
    ...('notes' in contact ? { notes: contact.notes.map(formatNote) } : {}),
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

function formatGroup(group: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

function normalizeCsvHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

function parseCsvRow(row: Record<string, string>): {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  optOut?: boolean;
} | null {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeCsvHeader(key), value?.trim() ?? '']),
  );

  const phone = normalized.phone || normalized.mobile || normalized.number;
  if (!phone) return null;

  const optOutRaw = normalized.opt_out || normalized.optout;
  const optOut =
    optOutRaw !== undefined && optOutRaw !== ''
      ? ['true', '1', 'yes', 'y'].includes(optOutRaw.toLowerCase())
      : undefined;

  return {
    phone,
    firstName: normalized.first_name || normalized.firstname || undefined,
    lastName: normalized.last_name || normalized.lastname || undefined,
    email: normalized.email || undefined,
    optOut,
  };
}

export class ContactsService {
  async list(
    organizationId: string,
    query: {
      page?: string;
      limit?: string;
      search?: string;
      tagId?: string;
      groupId?: string;
      optOut?: string;
    },
  ) {
    const { page, limit, skip } = getPagination(query);
    const filters = {
      search: query.search,
      tagId: query.tagId,
      groupId: query.groupId,
      optOut: query.optOut === undefined ? undefined : query.optOut === 'true',
    };

    const [contacts, total] = await Promise.all([
      contactsRepository.findMany(organizationId, skip, limit, filters),
      contactsRepository.count(organizationId, filters),
    ]);

    return {
      data: contacts.map(formatContact),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async getById(id: string, organizationId: string) {
    const contact = await contactsRepository.findById(id, organizationId);
    if (!contact) throw new NotFoundError('Contact not found');
    return formatContact(contact);
  }

  async create(organizationId: string, input: CreateContactInput) {
    const existing = await contactsRepository.findByPhone(organizationId, input.phone);
    if (existing) throw new ConflictError('Contact with this phone already exists');

    if (input.groupIds?.length) {
      const groups = await contactsRepository.findGroupsByIds(organizationId, input.groupIds);
      if (groups.length !== input.groupIds.length) {
        throw new BadRequestError('One or more groups are invalid');
      }
    }

    const contact = await contactsRepository.create({
      organization: { connect: { id: organizationId } },
      phone: input.phone,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      email: input.email ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      optOut: input.optOut ?? false,
    });

    if (input.tags?.length) {
      const tags = await contactsRepository.findOrCreateTags(organizationId, input.tags);
      await contactsRepository.addTagsToContact(
        contact.id,
        tags.map((tag) => tag.id),
      );
    }

    if (input.groupIds?.length) {
      await contactsRepository.addContactToGroups(contact.id, input.groupIds);
    }

    const created = await contactsRepository.findById(contact.id, organizationId);
    return formatContact(created!);
  }

  async update(id: string, organizationId: string, input: UpdateContactInput) {
    const contact = await contactsRepository.findById(id, organizationId);
    if (!contact) throw new NotFoundError('Contact not found');

    if (input.phone && input.phone !== contact.phone) {
      const existing = await contactsRepository.findByPhone(organizationId, input.phone);
      if (existing && existing.id !== id) {
        throw new ConflictError('Contact with this phone already exists');
      }
    }

    const updated = await contactsRepository.update(id, {
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Prisma.InputJsonValue }
        : {}),
      ...(input.optOut !== undefined ? { optOut: input.optOut } : {}),
    });

    return formatContact(updated);
  }

  async delete(id: string, organizationId: string) {
    const contact = await contactsRepository.findById(id, organizationId);
    if (!contact) throw new NotFoundError('Contact not found');

    await contactsRepository.delete(id);
    return { message: 'Contact deleted successfully' };
  }

  async importFromCsv(
    organizationId: string,
    fileBuffer: Buffer,
    options: { skipDuplicates?: boolean } = {},
  ) {
    if (!fileBuffer.length) {
      throw new BadRequestError('CSV file is empty');
    }

    let records: Record<string, string>[];
    try {
      records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as Record<string, string>[];
    } catch {
      throw new BadRequestError('Invalid CSV format');
    }

    if (records.length === 0) {
      throw new BadRequestError('CSV file contains no data rows');
    }

    const parsedRows: Array<ReturnType<typeof parseCsvRow>> = [];
    const errors: Array<{ row: number; message: string }> = [];
    const seenPhones = new Set<string>();

    records.forEach((record, index) => {
      const rowNumber = index + 2;
      const parsed = parseCsvRow(record);
      if (!parsed) {
        errors.push({ row: rowNumber, message: 'Phone is required' });
        return;
      }
      if (seenPhones.has(parsed.phone)) {
        errors.push({ row: rowNumber, message: 'Duplicate phone in file' });
        return;
      }
      seenPhones.add(parsed.phone);
      parsedRows.push(parsed);
    });

    const validRows = parsedRows.filter((row): row is NonNullable<typeof row> => row !== null);
    const imported = await contactsRepository.importBatchCreate(
      organizationId,
      validRows,
      options.skipDuplicates ?? true,
    );

    eventBus.emit(AppEvents.CONTACT_IMPORTED, {
      organizationId,
      count: imported,
    });

    return {
      imported,
      skipped: validRows.length - imported,
      errors,
      totalRows: records.length,
    };
  }

  async exportToCsv(
    organizationId: string,
    query: {
      search?: string;
      tagId?: string;
      groupId?: string;
      optOut?: string;
    },
  ): Promise<string> {
    const filters = {
      search: query.search,
      tagId: query.tagId,
      groupId: query.groupId,
      optOut: query.optOut === undefined ? undefined : query.optOut === 'true',
    };

    const contacts = await contactsRepository.findAllForExport(organizationId, filters);
    const header = 'phone,first_name,last_name,email,opt_out,tags';
    const lines = contacts.map((contact) => {
      const tags = contact.tagMaps.map((map) => map.tag.name).join('|');
      const values = [
        contact.phone,
        contact.firstName ?? '',
        contact.lastName ?? '',
        contact.email ?? '',
        contact.optOut ? 'true' : 'false',
        tags,
      ];
      return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
    });

    return [header, ...lines].join('\n');
  }

  async addTags(id: string, organizationId: string, input: CreateTagInput) {
    const contact = await contactsRepository.findById(id, organizationId);
    if (!contact) throw new NotFoundError('Contact not found');

    const tags = await contactsRepository.findOrCreateTags(organizationId, input.tags);
    await contactsRepository.addTagsToContact(
      id,
      tags.map((tag) => tag.id),
    );

    const updated = await contactsRepository.findById(id, organizationId);
    return formatContact(updated!);
  }

  async addNote(id: string, organizationId: string, authorId: string, input: CreateNoteInput) {
    const contact = await contactsRepository.findById(id, organizationId);
    if (!contact) throw new NotFoundError('Contact not found');

    const note = await contactsRepository.createNote(id, authorId, input.note);
    return formatNote(note);
  }

  async listGroups(
    organizationId: string,
    query: { page?: string; limit?: string; search?: string },
  ) {
    const { page, limit, skip } = getPagination(query);
    const [groups, total] = await Promise.all([
      contactsRepository.findGroups(organizationId, skip, limit, query.search),
      contactsRepository.countGroups(organizationId, query.search),
    ]);

    return {
      data: groups.map(formatGroup),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async createGroup(organizationId: string, input: CreateGroupInput) {
    const group = await contactsRepository.createGroup(organizationId, input);
    return formatGroup(group);
  }
}

export const contactsService = new ContactsService();
