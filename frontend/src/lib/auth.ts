import { ACCESS_TOKEN_MAX_AGE_SECONDS, AUTH_SESSION_COOKIE } from '@/lib/constants';
import type { AuthUser } from '@/types/api';

export { AUTH_SESSION_COOKIE } from '@/lib/constants';

let accessToken: string | null = null;

function setSessionCookie(): void {
  if (typeof document === 'undefined') return;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  document.cookie = `${AUTH_SESSION_COOKIE}=1; path=/; max-age=${ACCESS_TOKEN_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
  setSessionCookie();
}

export function clearAccessToken(): void {
  accessToken = null;
  clearSessionCookie();
}

export function isSuperAdmin(user: Pick<AuthUser, 'role'> | null | undefined): boolean {
  return user?.role.name === 'super_admin';
}

export function hasPermission(
  permissions: string[],
  permission: `${string}:${string}`,
): boolean {
  return permissions.includes(permission);
}

export function hasAnyPermission(
  permissions: string[],
  required: Array<`${string}:${string}`>,
): boolean {
  return required.some((permission) => permissions.includes(permission));
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { apiClient, unwrapApiData } = await import('./api-client');
  const response = await apiClient.get('/auth/me');
  return unwrapApiData<AuthUser>(response);
}
