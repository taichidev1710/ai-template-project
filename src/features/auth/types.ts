import type { EnabledFeature, UserStatus } from '@/shared/stores/auth-store';

/** Request/response types for the auth feature — mirror the backend contract. */

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** The `user` object returned alongside tokens by POST /auth/login. */
export interface AuthUserDto {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roleIds: string[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  user: AuthUserDto;
  tokens: TokenPair;
}

/** POST /auth/register — no tokens (account is pending approval). */
export interface RegisterResult {
  user: AuthUserDto;
}

/** GET /users/me — the profile the frontend uses to build menus and gate UI. */
export interface AuthProfile extends AuthUserDto {
  roles: Array<{ id: string; key: string; name: string; level: number }>;
  /** Union of permissions across roles + groups + extra; may contain wildcards. */
  permissions: string[];
  /** Features enabled in the registry — FE dynamic routing/menu source. */
  enabledFeatures: EnabledFeature[];
}
