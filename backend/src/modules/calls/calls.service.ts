import { CallStatus } from '@prisma/client';
import { callsRepository } from './calls.repository';
import { NotFoundError } from '../../shared/errors/app.error';
import { getPagination, buildPaginatedMeta } from '../../shared/utils/response';

function formatCallSummary(call: {
  id: string;
  exotelCallSid: string | null;
  direction: string;
  status: CallStatus;
  startedAt: Date | null;
  answeredAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number | null;
  languageDetected: string | null;
  leadQualified: boolean;
  disposition: string | null;
  summary: string | null;
  createdAt: Date;
  campaign: { id: string; name: string } | null;
  contact: { id: string; phone: string; firstName: string | null; lastName: string | null } | null;
  aiAgent: { id: string; name: string } | null;
  recording: {
    id: string;
    storageUrl: string | null;
    exotelRecordingUrl: string | null;
    durationSeconds: number | null;
  } | null;
}) {
  return {
    id: call.id,
    exotelCallSid: call.exotelCallSid,
    direction: call.direction,
    status: call.status,
    startedAt: call.startedAt,
    answeredAt: call.answeredAt,
    endedAt: call.endedAt,
    durationSeconds: call.durationSeconds,
    languageDetected: call.languageDetected,
    leadQualified: call.leadQualified,
    disposition: call.disposition,
    summary: call.summary,
    campaign: call.campaign,
    contact: call.contact,
    aiAgent: call.aiAgent,
    hasRecording: Boolean(call.recording),
    createdAt: call.createdAt,
  };
}

export class CallsService {
  async list(
    organizationId: string,
    query: {
      page?: string;
      limit?: string;
      status?: string;
      campaignId?: string;
      contactId?: string;
      from?: string;
      to?: string;
    },
  ) {
    const { page, limit, skip } = getPagination(query);
    const filters = {
      status: query.status as CallStatus | undefined,
      campaignId: query.campaignId,
      contactId: query.contactId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
    const [calls, total] = await Promise.all([
      callsRepository.findMany(organizationId, skip, limit, filters),
      callsRepository.count(organizationId, filters),
    ]);
    return {
      data: calls.map(formatCallSummary),
      meta: buildPaginatedMeta(total, page, limit),
    };
  }

  async getById(id: string, organizationId: string) {
    const call = await callsRepository.findById(id, organizationId);
    if (!call) throw new NotFoundError('Call not found');

    const { transcripts, ...rest } = call;
    return {
      ...formatCallSummary(rest),
      sentiment: call.sentiment,
      transcripts: transcripts.map((t) => ({
        id: t.id,
        speaker: t.speaker,
        text: t.text,
        language: t.language,
        confidence: t.confidence,
        startMs: t.startMs,
        endMs: t.endMs,
        sequence: t.sequence,
      })),
    };
  }

  async getTranscript(id: string, organizationId: string) {
    const call = await callsRepository.findById(id, organizationId);
    if (!call) throw new NotFoundError('Call not found');

    const transcripts = await callsRepository.findTranscripts(id, organizationId);
    return {
      callId: id,
      transcripts: transcripts.map((t) => ({
        id: t.id,
        speaker: t.speaker,
        text: t.text,
        language: t.language,
        confidence: t.confidence,
        startMs: t.startMs,
        endMs: t.endMs,
        sequence: t.sequence,
        createdAt: t.createdAt,
      })),
    };
  }

  async getRecording(id: string, organizationId: string) {
    const call = await callsRepository.findById(id, organizationId);
    if (!call) throw new NotFoundError('Call not found');

    const recording = await callsRepository.findRecording(id, organizationId);
    if (!recording) throw new NotFoundError('Recording not found');

    return {
      callId: id,
      recording: {
        id: recording.id,
        url: recording.storageUrl ?? recording.exotelRecordingUrl,
        storageUrl: recording.storageUrl,
        exotelRecordingUrl: recording.exotelRecordingUrl,
        durationSeconds: recording.durationSeconds,
        format: recording.format,
      },
    };
  }

  async getLive(organizationId: string) {
    const calls = await callsRepository.findLive(organizationId);
    return {
      count: calls.length,
      calls: calls.map(formatCallSummary),
    };
  }
}

export const callsService = new CallsService();
