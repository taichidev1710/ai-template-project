import type { UserStatus } from '@/shared/stores/auth-store';

export interface User {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roleIds: string[];
  managerId: string | null;
  permissionGroupIds: string[];
  extraPermissions: string[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  email: string;
  name: string;
  password: string;
  roleIds: string[];
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
}
