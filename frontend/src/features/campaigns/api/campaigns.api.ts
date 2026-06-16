import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '@/lib/api-client';
import type {
  CreateCampaignInput,
  ImportCampaignContactsInput,
  ListCampaignsQuery,
} from '@/features/campaigns/schemas';
import type { Campaign, ImportContactsResult } from '@/features/campaigns/types';

function buildParams(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string>;
}

export async function fetchCampaigns(query: ListCampaignsQuery = {}) {
  return apiGetPaginated<Campaign>('/campaigns', { params: buildParams(query) });
}

export async function fetchCampaign(id: string): Promise<Campaign> {
  return apiGet<Campaign>(`/campaigns/${id}`);
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const body = {
    ...input,
    exotelFlowUrl: input.exotelFlowUrl?.trim() || undefined,
    knowledgeBaseId: input.knowledgeBaseId?.trim() || undefined,
  };
  return apiPost<Campaign, typeof body>('/campaigns', body);
}

export async function updateCampaign(
  id: string,
  input: Partial<CreateCampaignInput>,
): Promise<Campaign> {
  return apiPatch<Campaign, Partial<CreateCampaignInput>>(`/campaigns/${id}`, input);
}

export async function deleteCampaign(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/campaigns/${id}`);
}

export async function startCampaign(id: string): Promise<Campaign> {
  return apiPost<Campaign>(`/campaigns/${id}/start`);
}

export async function pauseCampaign(id: string): Promise<Campaign> {
  return apiPost<Campaign>(`/campaigns/${id}/pause`);
}

export async function stopCampaign(id: string): Promise<Campaign> {
  return apiPost<Campaign>(`/campaigns/${id}/stop`);
}

export async function importCampaignContacts(
  id: string,
  input: ImportCampaignContactsInput,
): Promise<ImportContactsResult> {
  return apiPost<ImportContactsResult, ImportCampaignContactsInput>(
    `/campaigns/${id}/contacts/import`,
    input,
  );
}
