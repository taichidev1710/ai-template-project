/** Request/response types for the auth feature — mirror the backend contract. */

export interface LoginInput {
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

/** GET /users/me — the profile the frontend uses to build menus and gate UI. */
export interface AuthProfile extends AuthUserDto {
  roles: Array<{ id: string; key: string; name: string; level: number }>;
  /** Union of permissions across roles; may contain '*' or 'user:*' wildcards. */
  permissions: string[];
}
