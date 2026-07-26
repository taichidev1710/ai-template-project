export interface ApiErrorBody {
  message?: string;
  code?: string;
  /** The backend nests the real error here: { success: false, error: { code, message } }. */
  error?: { message?: string; code?: string; details?: unknown };
}

/** Every backend response is wrapped in this envelope: { success, data, meta? }. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

/** Standard shape for paginated list endpoints. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}
