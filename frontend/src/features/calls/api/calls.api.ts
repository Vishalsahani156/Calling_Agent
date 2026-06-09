import { apiGet, apiGetPaginated } from '@/lib/api-client';
import type { ListCallsQuery } from '@/features/calls/schemas';
import type {
  CallDetail,
  CallRecordingResponse,
  CallSummary,
  CallTranscriptResponse,
  LiveCallsResponse,
} from '@/features/calls/types';

function buildParams(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string>;
}

export async function fetchCalls(query: ListCallsQuery = {}) {
  return apiGetPaginated<CallSummary>('/calls', { params: buildParams(query) });
}

export async function fetchCall(id: string): Promise<CallDetail> {
  return apiGet<CallDetail>(`/calls/${id}`);
}

export async function fetchCallTranscript(id: string): Promise<CallTranscriptResponse> {
  return apiGet<CallTranscriptResponse>(`/calls/${id}/transcript`);
}

export async function fetchCallRecording(id: string): Promise<CallRecordingResponse> {
  return apiGet<CallRecordingResponse>(`/calls/${id}/recording`);
}

export async function fetchLiveCalls(): Promise<LiveCallsResponse> {
  return apiGet<LiveCallsResponse>('/calls/live');
}
