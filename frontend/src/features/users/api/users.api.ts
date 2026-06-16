import { apiClient, apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, unwrapApiData } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  CreateUserInput,
  InviteUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from '@/features/users/schemas';
import type { Permission, Role, UserListItem } from '@/features/users/types';

export async function fetchUsers(query: ListUsersQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  );
  return apiGetPaginated<UserListItem>('/users', { params });
}

export async function fetchUser(id: string): Promise<UserListItem> {
  return apiGet<UserListItem>(`/users/${id}`);
}

export async function createUser(input: CreateUserInput): Promise<UserListItem> {
  return apiPost<UserListItem, CreateUserInput>('/users', input);
}

export async function inviteUser(
  input: InviteUserInput,
): Promise<{ message: string; user: UserListItem }> {
  const response = await apiClient.post<ApiResponse<{ message: string; user: UserListItem }>>(
    '/users/invite',
    input,
  );
  return unwrapApiData(response);
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserListItem> {
  return apiPatch<UserListItem, UpdateUserInput>(`/users/${id}`, input);
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/users/${id}`);
}

export async function fetchRoles(assignableOnly = false): Promise<Role[]> {
  return apiGet<Role[]>('/users/roles', {
    params: assignableOnly ? { assignable: 'true' } : undefined,
  });
}

export async function fetchPermissions(): Promise<Permission[]> {
  return apiGet<Permission[]>('/users/permissions');
}
