import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const USER_STATUSES = ['pending', 'active', 'rejected', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** "Thế giới" tài khoản — quyết định khu vực sau đăng nhập (staff /admin vs member /app). */
export const USER_TYPES = ['staff', 'member'] as const;
export type UserType = (typeof USER_TYPES)[number];

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

/** Cấp bậc member đã resolve (từ /users/me) — dùng dựng khu member. */
export interface MemberTier {
  id: string;
  key: string;
  name: string;
  description: string;
  rank: number;
  color: string;
  icon: string;
  perks: string[];
  limits: Record<string, number>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  /** staff (RBAC) hay member (tier) — nguồn điều hướng khu vực. */
  userType: UserType;
  /** Role keys (e.g. 'super_admin', 'staff') — flattened from the profile. */
  roles: string[];
  /** Effective permission set (roles ∪ groups ∪ extra); may contain wildcards. */
  permissions: string[];
  /** (member) Cấp bậc hiện tại; staff = null. */
  tier: MemberTier | null;
  /** (member) Quyền member hiệu lực (∪ tier ∪ nhóm lẻ ∪ extra); staff = []. */
  memberPermissions: string[];
}

interface AuthState {
  /** Access token — attached as the bearer on every request. Short-lived. */
  token: string | null;
  /** Refresh token — used to silently rotate an expired access token. */
  refreshToken: string | null;
  user: AuthUser | null;
  /** Features enabled in the registry — FE maps routes/menu against these. */
  enabledFeatures: EnabledFeature[];
  /** (member) Chức năng member đang bật — FE khu member dựng menu/thẻ theo tier. */
  enabledMemberFeatures: EnabledFeature[];
  isAuthenticated: boolean;
  setAuth: (payload: {
    token: string;
    refreshToken: string;
    user: AuthUser;
    enabledFeatures: EnabledFeature[];
    enabledMemberFeatures: EnabledFeature[];
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
      enabledMemberFeatures: [],
      isAuthenticated: false,
      setAuth: ({ token, refreshToken, user, enabledFeatures, enabledMemberFeatures }) =>
        set({
          token,
          refreshToken,
          user,
          enabledFeatures,
          enabledMemberFeatures,
          isAuthenticated: true,
        }),
      setTokens: ({ accessToken, refreshToken }) => set({ token: accessToken, refreshToken }),
      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          enabledFeatures: [],
          enabledMemberFeatures: [],
          isAuthenticated: false,
        }),
    }),
    { name: 'app-auth' },
  ),
);
