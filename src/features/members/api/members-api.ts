import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { UserStatus } from '@/shared/stores/auth-store';
import type { MemberItem, MemberListParams } from '../types';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const membersApi = {
  list: async (params: MemberListParams): Promise<{ items: MemberItem[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<MemberItem[]> & { meta: ListMeta }>(
      '/members',
      { params },
    );
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  approve: async (id: string): Promise<MemberItem> => {
    const { data } = await apiClient.post<ApiEnvelope<MemberItem>>(`/members/${id}/approve`);
    return data.data;
  },
  reject: async (id: string, reason: string): Promise<MemberItem> => {
    const { data } = await apiClient.post<ApiEnvelope<MemberItem>>(`/members/${id}/reject`, {
      reason,
    });
    return data.data;
  },
  setStatus: async (id: string, status: Extract<UserStatus, 'active' | 'disabled'>): Promise<MemberItem> => {
    const { data } = await apiClient.patch<ApiEnvelope<MemberItem>>(`/members/${id}/status`, {
      status,
    });
    return data.data;
  },
  reassignTier: async (id: string, tierId: string | null): Promise<MemberItem> => {
    const { data } = await apiClient.patch<ApiEnvelope<MemberItem>>(`/members/${id}/tier`, {
      tierId,
    });
    return data.data;
  },
  setMemberGroups: async (id: string, groupIds: string[]): Promise<MemberItem> => {
    const { data } = await apiClient.patch<ApiEnvelope<MemberItem>>(`/members/${id}/member-groups`, {
      groupIds,
    });
    return data.data;
  },
};
