import { apiGet, apiGetPaginated, apiPost } from '@/lib/api-client';
import type { ListCallsQuery, TestCallInput } from '@/features/calls/schemas';
import type { CallDetail, CallSummary, TestCallResult } from '@/features/calls/types';

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

export async function placeTestCall(input: TestCallInput): Promise<TestCallResult> {
  return apiPost<TestCallResult, TestCallInput>('/calls/test', input);
}
