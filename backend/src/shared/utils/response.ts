import { Response } from 'express';
import { AppError } from '../errors/app.error';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendMessage(res: Response, message: string, statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, message });
}

export function sendError(res: Response, error: AppError): Response {
  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    details: error.details,
  });
}

export function getPagination(query: { page?: string; limit?: string }): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginatedMeta(total: number, page: number, limit: number): PaginatedMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
