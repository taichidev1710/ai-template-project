import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { AuthProfile, LoginInput, LoginResult } from '../types';

/**
 * Feature API layer: the ONLY place that knows the auth endpoint URLs.
 * The backend wraps every response in { success, data } — unwrap it here so
 * hooks and components work with plain payloads.
 */
export const authApi = {
  login: async (input: LoginInput): Promise<LoginResult> => {
    const { data } = await apiClient.post<ApiEnvelope<LoginResult>>('/auth/login', input);
    return data.data;
  },

  /**
   * Current user's full profile (roles + permissions). Accepts an explicit
   * token so the login flow can fetch it before the store is populated,
   * without relying on interceptor timing.
   */
  me: async (accessToken?: string): Promise<AuthProfile> => {
    const { data } = await apiClient.get<ApiEnvelope<AuthProfile>>(
      '/users/me',
      accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    );
    return data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};
