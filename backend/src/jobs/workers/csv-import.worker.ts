import { Worker, type Job } from 'bullmq';
import { parse } from 'csv-parse/sync';
import { readFile } from 'fs/promises';
import pino from 'pino';
import { getBullMQConnection } from '../../config/redis';
import { prisma } from '../../config/database';
import { eventBus, AppEvents } from '../../events/event-bus';
import { QUEUE_NAMES, type CsvImportJobData } from '../queues';

const logger = pino({ name: 'csv-import-worker' });

const BATCH_SIZE = 500;

interface CsvRow {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) {
    return null;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  return digits.startsWith('+') ? raw.trim() : `+${digits}`;
}

function parseCsvRows(content: string): CsvRow[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const rows: CsvRow[] = [];

  for (const record of records) {
    const phone =
      record.phone ??
      record.Phone ??
      record.mobile ??
      record.Mobile ??
      record.number ??
      record.Number;

    if (!phone) {
      continue;
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      continue;
    }

    rows.push({
      phone: normalized,
      firstName: record.first_name ?? record.firstName ?? record.FirstName ?? undefined,
      lastName: record.last_name ?? record.lastName ?? record.LastName ?? undefined,
      email: record.email ?? record.Email ?? undefined,
    });
  }

  return rows;
}

async function processCsvImport(job: Job<CsvImportJobData>): Promise<{ imported: number; skipped: number }> {
  const { organizationId, filePath, campaignId, groupId } = job.data;

  const content = await readFile(filePath, 'utf-8');
  const rows = parseCsvRows(content);

  const uniqueByPhone = new Map<string, CsvRow>();
  for (const row of rows) {
    uniqueByPhone.set(row.phone, row);
  }

  const dedupedRows = [...uniqueByPhone.values()];
  let imported = 0;
  let skipped = 0;

  for (let offset = 0; offset < dedupedRows.length; offset += BATCH_SIZE) {
    const batch = dedupedRows.slice(offset, offset + BATCH_SIZE);

    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        const existing = await tx.contact.findUnique({
          where: {
            organizationId_phone: {
              organizationId,
              phone: row.phone,
            },
          },
        });

        if (existing?.optOut) {
          skipped += 1;
          continue;
        }

        const contact = await tx.contact.upsert({
          where: {
            organizationId_phone: {
              organizationId,
              phone: row.phone,
            },
          },
          create: {
            organizationId,
            phone: row.phone,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
          },
          update: {
            firstName: row.firstName ?? undefined,
            lastName: row.lastName ?? undefined,
            email: row.email ?? undefined,
          },
        });

        if (groupId) {
          await tx.contactGroupMap.upsert({
            where: {
              contactId_groupId: {
                contactId: contact.id,
                groupId,
              },
            },
            create: {
              contactId: contact.id,
              groupId,
            },
            update: {},
          });
        }

        if (campaignId) {
          const campaignContact = await tx.campaignContact.upsert({
            where: {
              campaignId_contactId: {
                campaignId,
                contactId: contact.id,
              },
            },
            create: {
              campaignId,
              contactId: contact.id,
              status: 'pending',
            },
            update: {},
          });

          if (campaignContact.status === 'skipped') {
            skipped += 1;
            continue;
          }
        }

        imported += 1;
      }
    });

    await job.updateProgress(Math.round(((offset + batch.length) / dedupedRows.length) * 100));
  }

  eventBus.emit(AppEvents.CONTACT_IMPORTED, { organizationId, count: imported });

  return { imported, skipped };
}

export function createCsvImportWorker(): Worker<CsvImportJobData> {
  const worker = new Worker<CsvImportJobData>(
    QUEUE_NAMES.CSV_IMPORT,
    async (job) => {
      logger.info({ jobId: job.id, organizationId: job.data.organizationId }, 'Starting CSV import');
      const result = await processCsvImport(job);
      logger.info({ jobId: job.id, ...result }, 'CSV import completed');
      return result;
    },
    {
      connection: getBullMQConnection(),
      concurrency: 2,
    },
  );

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, err: error }, 'CSV import job failed');
  });

  return worker;
}
