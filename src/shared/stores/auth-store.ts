import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserStatus = 'pending' | 'active' | 'rejected' | 'disabled';

export interface FeatureAction {
  key: string;
  label: string;
}

/** A feature enabled in the backend registry — drives dynamic routes/menu. */
export interface EnabledFeature {
  key: string;
  name: string;
  icon: string;
  order: number;
  actions: FeatureAction[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  /** Role keys (e.g. 'super_admin', 'staff') — flattened from the profile. */
  roles: string[];
  /** Effective permission set (roles ∪ groups ∪ extra); may contain wildcards. */
  permissions: string[];
}

interface AuthState {
  /** Access token — attached as the bearer on every request. Short-lived. */
  token: string | null;
  /** Refresh token — used to silently rotate an expired access token. */
  refreshToken: string | null;
  user: AuthUser | null;
  /** Features enabled in the registry — FE maps routes/menu against these. */
  enabledFeatures: EnabledFeature[];
  isAuthenticated: boolean;
  setAuth: (payload: {
    token: string;
    refreshToken: string;
    user: AuthUser;
    enabledFeatures: EnabledFeature[];
  }) => void;
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
      enabledFeatures: [],
      isAuthenticated: false,
      setAuth: ({ token, refreshToken, user, enabledFeatures }) =>
        set({ token, refreshToken, user, enabledFeatures, isAuthenticated: true }),
      setTokens: ({ accessToken, refreshToken }) => set({ token: accessToken, refreshToken }),
      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          enabledFeatures: [],
          isAuthenticated: false,
        }),
    }),
    { name: 'app-auth' },
  ),
);
