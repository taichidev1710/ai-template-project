import type { UserStatus } from '@/shared/stores/auth-store';

export interface MemberItem {
  id: string;
  email: string;
  name: string;
  userType: 'staff' | 'member';
  status: UserStatus;
  tierId: string | null;
  memberPermissionGroupIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemberListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  tier?: string;
}
