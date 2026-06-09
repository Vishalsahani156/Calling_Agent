import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/lib/api-client';
import type {
  CreateAgentInput,
  ListAgentsQuery,
  TestAgentInput,
  UpdateAgentInput,
} from '@/features/agents/schemas';
import type { Agent, TestAgentResult } from '@/features/agents/types';

function buildParams(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string>;
}

export async function fetchAgents(query: ListAgentsQuery = {}) {
  return apiGetPaginated<Agent>('/agents', { params: buildParams(query) });
}

export async function fetchAgent(id: string): Promise<Agent> {
  return apiGet<Agent>(`/agents/${id}`);
}

export async function createAgent(input: CreateAgentInput): Promise<Agent> {
  return apiPost<Agent, CreateAgentInput>('/agents', input);
}

export async function updateAgent(id: string, input: UpdateAgentInput): Promise<Agent> {
  return apiPatch<Agent, UpdateAgentInput>(`/agents/${id}`, input);
}

export async function deleteAgent(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/agents/${id}`);
}

export async function testAgent(id: string, input: TestAgentInput): Promise<TestAgentResult> {
  return apiPost<TestAgentResult, TestAgentInput>(`/agents/${id}/test`, input);
}
