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

export interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static fromBody(body: ApiErrorBody, statusCode: number): ApiError {
    return new ApiError(body.message, statusCode, body.code, body.details);
  }
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: {
    name: string;
    description: string | null;
  };
  permissions: string[];
}

export interface AuthTokensResponse {
  accessToken: string;
  user: AuthUser;
}
