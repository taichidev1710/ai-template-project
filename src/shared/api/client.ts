import axios, { type AxiosError } from 'axios';
import { env } from '@/shared/config/env';
import { useAuthStore } from '@/shared/stores/auth-store';
import type { ApiErrorBody } from './types';

/** Single axios instance for the whole app. Import this, never call axios directly. */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token from the auth store on every request.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface NormalizedError {
  status: number | null;
  message: string;
  code?: string;
}

// Normalize errors into a predictable shape and handle auth expiry.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    const normalized: NormalizedError = {
      status: error.response?.status ?? null,
      message: error.response?.data?.message ?? error.message ?? 'Unexpected error',
      code: error.response?.data?.code,
    };
    return Promise.reject(normalized);
  },
);
