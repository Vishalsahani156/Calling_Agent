import { apiClient, apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, unwrapApiData } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  CreateContactInput,
  CreateGroupInput,
  CreateNoteInput,
  CreateTagInput,
  ExportContactsQuery,
  ImportContactsInput,
  ListContactsQuery,
  ListGroupsQuery,
  UpdateContactInput,
} from '@/features/contacts/schemas';
import type { Contact, ContactGroup, ContactNote, ImportContactsResponse } from '@/features/contacts/types';

function buildParams(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string>;
}

export async function fetchContacts(query: ListContactsQuery = {}) {
  return apiGetPaginated<Contact>('/contacts', { params: buildParams(query) });
}

export async function fetchContact(id: string): Promise<Contact> {
  return apiGet<Contact>(`/contacts/${id}`);
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const payload = {
    ...input,
    email: input.email || undefined,
    tags: input.tags?.length ? input.tags : undefined,
    groupIds: input.groupIds?.length ? input.groupIds : undefined,
  };
  return apiPost<Contact, CreateContactInput>('/contacts', payload);
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
  const payload = {
    ...input,
    email: input.email === '' ? null : input.email,
    firstName: input.firstName === '' ? null : input.firstName,
    lastName: input.lastName === '' ? null : input.lastName,
  };
  return apiPatch<Contact, UpdateContactInput>(`/contacts/${id}`, payload);
}

export async function deleteContact(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/contacts/${id}`);
}

export async function importContacts(
  file: File,
  input: ImportContactsInput = {},
): Promise<ImportContactsResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (input.skipDuplicates !== undefined) {
    formData.append('skipDuplicates', String(input.skipDuplicates));
  }
  if (input.groupId) {
    formData.append('groupId', input.groupId);
  }
  const response = await apiClient.post<ApiResponse<ImportContactsResponse>>(
    '/contacts/import',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrapApiData(response);
}

export async function exportContacts(query: ExportContactsQuery = {}): Promise<Blob> {
  const response = await apiClient.get('/contacts/export', {
    params: buildParams(query),
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function addContactTags(id: string, input: CreateTagInput): Promise<Contact> {
  return apiPost<Contact, CreateTagInput>(`/contacts/${id}/tags`, input);
}

export async function addContactNote(id: string, input: CreateNoteInput): Promise<ContactNote> {
  return apiPost<ContactNote, CreateNoteInput>(`/contacts/${id}/notes`, input);
}

export async function fetchGroups(query: ListGroupsQuery = {}) {
  return apiGetPaginated<ContactGroup>('/groups', { params: buildParams(query) });
}

export async function createGroup(input: CreateGroupInput): Promise<ContactGroup> {
  return apiPost<ContactGroup, CreateGroupInput>('/groups', input);
}
