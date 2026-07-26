import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/shared/config/env';
import { useAuthStore } from '@/shared/stores/auth-store';
import type { ApiEnvelope, ApiErrorBody } from './types';

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

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** The backend nests the human message under `error`; fall back to the flat shape. */
function extractMessage(body: ApiErrorBody | undefined, fallback: string): string {
  return body?.error?.message ?? body?.message ?? fallback;
}

/**
 * Silent refresh: shared across concurrent 401s so we only rotate once.
 * Uses a bare axios call to avoid re-entering this interceptor (recursion).
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
      `${env.apiBaseUrl}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    useAuthStore.getState().setTokens(data.data);
    return data.data.accessToken;
  } catch {
    return null;
  }
}

// Normalize errors into a predictable shape and transparently rotate expired tokens.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status ?? null;
    // Auth endpoints (login/refresh/logout) must never trigger a refresh retry:
    // a 401 there means bad credentials or a dead session, not an expired token.
    const isAuthCall = (original?.url ?? '').includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      // Refresh impossible/failed → the session is over.
      useAuthStore.getState().clearAuth();
    }

    const normalized: NormalizedError = {
      status,
      message: extractMessage(error.response?.data, error.message ?? 'Unexpected error'),
      code: error.response?.data?.error?.code ?? error.response?.data?.code,
    };
    return Promise.reject(normalized);
  },
);
