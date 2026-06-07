import { CallStatus, Prisma, TranscriptSpeaker } from '@prisma/client';
import { prisma } from '../../config/database';

const callInclude = {
  campaign: { select: { id: true, name: true } },
  contact: { select: { id: true, phone: true, firstName: true, lastName: true } },
  aiAgent: { select: { id: true, name: true } },
  recording: { select: { id: true, storageUrl: true, exotelRecordingUrl: true, durationSeconds: true } },
} satisfies Prisma.CallInclude;

export class CallsRepository {
  findMany(
    organizationId: string,
    skip: number,
    limit: number,
    filters?: {
      status?: CallStatus;
      campaignId?: string;
      contactId?: string;
      from?: Date;
      to?: Date;
    },
  ) {
    return prisma.call.findMany({
      where: {
        organizationId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters?.contactId ? { contactId: filters.contactId } : {}),
        ...(filters?.from || filters?.to
          ? {
              startedAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      include: callInclude,
      skip,
      take: limit,
      orderBy: { startedAt: 'desc' },
    });
  }

  count(
    organizationId: string,
    filters?: {
      status?: CallStatus;
      campaignId?: string;
      contactId?: string;
      from?: Date;
      to?: Date;
    },
  ) {
    return prisma.call.count({
      where: {
        organizationId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters?.contactId ? { contactId: filters.contactId } : {}),
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

  findById(id: string, organizationId: string) {
    return prisma.call.findFirst({
      where: { id, organizationId },
      include: {
        ...callInclude,
        transcripts: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  findLive(organizationId: string) {
    return prisma.call.findMany({
      where: {
        organizationId,
        status: { in: [CallStatus.initiated, CallStatus.ringing, CallStatus.in_progress] },
      },
      include: callInclude,
      orderBy: { startedAt: 'desc' },
    });
  }

  findTranscripts(callId: string, organizationId: string) {
    return prisma.callTranscript.findMany({
      where: { callId, call: { organizationId } },
      orderBy: { sequence: 'asc' },
    });
  }

  findRecording(callId: string, organizationId: string) {
    return prisma.callRecording.findFirst({
      where: { callId, call: { organizationId } },
    });
  }

  getNextTranscriptSequence(callId: string) {
    return prisma.callTranscript
      .aggregate({
        where: { callId },
        _max: { sequence: true },
      })
      .then((result) => (result._max.sequence ?? -1) + 1);
  }

  createTranscript(
    callId: string,
    data: {
      speaker: TranscriptSpeaker;
      text: string;
      sequence: number;
      startMs: number;
      endMs: number;
      language?: string;
      confidence?: number;
    },
  ) {
    return prisma.callTranscript.create({
      data: {
        callId,
        speaker: data.speaker,
        text: data.text,
        sequence: data.sequence,
        startMs: data.startMs,
        endMs: data.endMs,
        language: data.language,
        confidence: data.confidence,
      },
    });
  }
}

export const callsRepository = new CallsRepository();
