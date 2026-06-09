import { apiGet, apiPost } from '@/lib/api-client';
import type { AuthTokensResponse, AuthUser } from '@/types/api';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@/features/auth/schemas';

export async function login(input: LoginInput): Promise<AuthTokensResponse> {
  return apiPost<AuthTokensResponse, LoginInput>('/auth/login', input);
}

export async function register(input: RegisterInput): Promise<AuthTokensResponse> {
  return apiPost<AuthTokensResponse, RegisterInput>('/auth/register', input);
}

export async function logout(): Promise<void> {
  await apiPost<{ message: string }>('/auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  return apiGet<AuthUser>('/auth/me');
}

export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<{ message: string }> {
  return apiPost<{ message: string }, ForgotPasswordInput>('/auth/forgot-password', input);
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<{ message: string }> {
  return apiPost<{ message: string }, ResetPasswordInput>('/auth/reset-password', input);
}
