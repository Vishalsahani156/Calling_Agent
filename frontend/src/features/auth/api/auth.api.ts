import { apiClient, unwrapApiData } from '@/lib/api-client';
import type { ApiResponse, AuthTokensResponse, AuthUser } from '@/types/api';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@/features/auth/schemas';

export async function login(input: LoginInput): Promise<AuthTokensResponse> {
  const response = await apiClient.post<ApiResponse<AuthTokensResponse>>('/auth/login', input);
  return unwrapApiData(response);
}

export async function register(input: RegisterInput): Promise<AuthTokensResponse> {
  const response = await apiClient.post<ApiResponse<AuthTokensResponse>>('/auth/register', input);
  return unwrapApiData(response);
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
  return unwrapApiData(response);
}

export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    '/auth/forgot-password',
    input,
  );
  return unwrapApiData(response);
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    '/auth/reset-password',
    input,
  );
  return unwrapApiData(response);
}
