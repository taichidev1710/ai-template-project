import type { UserStatus } from '@/shared/stores/auth-store';

export interface AccountUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roleIds: string[];
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRecord {
  id: string;
  targetUserId: string;
  action: 'approve' | 'reject';
  actorId: string;
  actorSnapshot: { name: string; email: string; roleKeys: string[] };
  reason: string;
  createdAt: string;
}

export interface PendingListParams {
  page?: number;
  limit?: number;
  search?: string;
}
