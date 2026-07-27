import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { AccountUser, ApprovalRecord, PendingListParams } from '../types';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Feature API layer for account approval — the only place that knows these URLs.
 * The backend wraps responses in { success, data, meta? }; unwrap here.
 */
export const accountsApi = {
  listPending: async (
    params: PendingListParams,
  ): Promise<{ items: AccountUser[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<AccountUser[]> & { meta: ListMeta }>(
      '/users/pending',
      { params },
    );
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },

  approve: async (id: string): Promise<AccountUser> => {
    const { data } = await apiClient.post<ApiEnvelope<AccountUser>>(`/users/${id}/approve`);
    return data.data;
  },

  reject: async (id: string, reason: string): Promise<AccountUser> => {
    const { data } = await apiClient.post<ApiEnvelope<AccountUser>>(`/users/${id}/reject`, {
      reason,
    });
    return data.data;
  },

  history: async (id: string): Promise<ApprovalRecord[]> => {
    const { data } = await apiClient.get<ApiEnvelope<ApprovalRecord[]>>(`/users/${id}/approvals`);
    return data.data;
  },
};
