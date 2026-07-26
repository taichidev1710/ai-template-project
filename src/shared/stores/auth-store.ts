import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Role keys (e.g. 'super_admin', 'staff') — flattened from the profile. */
  roles: string[];
  /** Flattened permission set (may contain wildcards like '*' or 'user:*'). */
  permissions: string[];
}

interface AuthState {
  /** Access token — attached as the bearer on every request. Short-lived. */
  token: string | null;
  /** Refresh token — used to silently rotate an expired access token. */
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (payload: { token: string; refreshToken: string; user: AuthUser }) => void;
  /** Replace only the token pair (used by the silent-refresh interceptor). */
  setTokens: (payload: { accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
}

/** Client-side auth state (client state → Zustand, per state-management rules). */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: ({ token, refreshToken, user }) =>
        set({ token, refreshToken, user, isAuthenticated: true }),
      setTokens: ({ accessToken, refreshToken }) => set({ token: accessToken, refreshToken }),
      clearAuth: () =>
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    { name: 'app-auth' },
  ),
);
