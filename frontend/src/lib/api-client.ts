import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth';
import type {
  ApiErrorBody,
  ApiResponse,
  AuthTokensResponse,
  PaginatedMeta,
} from '@/types/api';
import { ApiError } from '@/types/api';

function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_USE_API_PROXY === 'true') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30_000,
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processRefreshQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const response = await axios.post<ApiResponse<AuthTokensResponse>>(
    `${resolveBaseUrl()}/auth/refresh`,
    {},
    { withCredentials: true },
  );

  const body = response.data;
  if (!body.success || !body.data?.accessToken) {
    throw ApiError.fromBody(
      {
        success: false,
        message: body.message ?? 'Session expired',
        code: 'UNAUTHORIZED',
      },
      401,
    );
  }

  setAccessToken(body.data.accessToken);
  return body.data.accessToken;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')
    ) {
      return Promise.reject(normalizeAxiosError(error));
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      processRefreshQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processRefreshQueue(refreshError, null);
      clearAccessToken();
      return Promise.reject(normalizeAxiosError(error));
    } finally {
      isRefreshing = false;
    }
  },
);

function normalizeAxiosError(error: AxiosError<ApiErrorBody>): ApiError {
  if (error.response?.data && error.response.data.success === false) {
    return ApiError.fromBody(error.response.data, error.response.status);
  }

  return new ApiError(
    error.message || 'Network error',
    error.response?.status ?? 500,
    'NETWORK_ERROR',
  );
}

export function unwrapApiData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data;

  if (!body.success) {
    throw new ApiError(body.message ?? 'Request failed', response.status, 'API_ERROR');
  }

  if (body.data === undefined) {
    throw new ApiError('Response missing data', response.status, 'API_ERROR');
  }

  return body.data;
}

export function unwrapApiMessage(response: AxiosResponse<ApiResponse>): string {
  const body = response.data;

  if (!body.success) {
    throw new ApiError(body.message ?? 'Request failed', response.status, 'API_ERROR');
  }

  return body.message ?? 'Success';
}

export function unwrapPaginatedData<T>(
  response: AxiosResponse<ApiResponse<T[]>>,
): { data: T[]; meta: PaginatedMeta } {
  const data = unwrapApiData<T[]>(response);
  const meta = response.data.meta as PaginatedMeta | undefined;

  if (!meta) {
    throw new ApiError('Response missing pagination meta', response.status, 'API_ERROR');
  }

  return { data, meta };
}

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return unwrapApiData(response);
}

export async function apiGetPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<{ data: T[]; meta: PaginatedMeta }> {
  const response = await apiClient.get<ApiResponse<T[]>>(url, config);
  return unwrapPaginatedData(response);
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body, config);
  return unwrapApiData(response);
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, body, config);
  return unwrapApiData(response);
}

export async function apiPut<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, body, config);
  return unwrapApiData(response);
}

export async function apiDelete<T = void>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  if (response.data.data === undefined) {
    return undefined as T;
  }
  return unwrapApiData(response);
}
