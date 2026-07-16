export interface ApiErrorBody {
  message?: string;
  code?: string;
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
