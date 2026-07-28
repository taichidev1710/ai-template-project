import { useMutation } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { paths } from '@/app/router/paths';
import type { NormalizedError } from '@/shared/api';
import { useAuthStore, type AuthUser } from '@/shared/stores/auth-store';
import { authApi } from '../api/auth-api';
import type { AuthProfile, LoginInput, RegisterInput } from '../types';

/** Flatten the backend profile into the client's auth-user shape. */
function toAuthUser(profile: AuthProfile): AuthUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    status: profile.status,
    userType: profile.userType,
    roles: profile.roles.map((r) => r.key),
    permissions: profile.permissions,
    tier: profile.tier,
    memberPermissions: profile.memberPermissions,
  };
}

/** Khu vực mặc định sau đăng nhập theo "thế giới" của tài khoản. */
function homeFor(userType: AuthProfile['userType']): string {
  return userType === 'member' ? paths.app.home : paths.dashboard;
}

/**
 * Login flow: authenticate → fetch the full profile → persist token pair + user.
 * Redirects to wherever the user was headed before ProtectedRoute intercepted,
 * or the dashboard.
 */
export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { message } = App.useApp();
  const { t } = useTranslation();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { tokens } = await authApi.login(input);
      // Pass the fresh access token explicitly — the store isn't populated yet.
      const profile = await authApi.me(tokens.accessToken);
      return { tokens, profile };
    },
    onSuccess: ({ tokens, profile }) => {
      setAuth({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: toAuthUser(profile),
        enabledFeatures: profile.enabledFeatures,
        enabledMemberFeatures: profile.enabledMemberFeatures,
      });
      navigate(from ?? homeFor(profile.userType), { replace: true });
    },
    onError: (e: NormalizedError) => {
      message.error(e.message || t('error.generic'));
    },
  });
}

/**
 * Public sign-up. On success the account is PENDING (no auto-login) — the page
 * shows a "waiting for approval" state instead of navigating into the app.
 */
export function useRegister() {
  const { message } = App.useApp();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onError: (e: NormalizedError) => {
      message.error(e.message || t('error.generic'));
    },
  });
}

/** Logout: revoke the refresh token server-side, then clear local state. */
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      // Best-effort revoke — never block logout on a network error.
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch {
          /* ignore — we clear local state regardless */
        }
      }
    },
    onSettled: () => {
      clearAuth();
      navigate(paths.login, { replace: true });
    },
  });
}
