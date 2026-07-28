import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { MemberGroup, MemberGroupInput, MemberGroupListParams } from '../types';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const memberGroupsApi = {
  list: async (params: MemberGroupListParams): Promise<{ items: MemberGroup[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<MemberGroup[]> & { meta: ListMeta }>(
      '/member-groups',
      { params },
    );
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  create: async (input: MemberGroupInput): Promise<MemberGroup> => {
    const { data } = await apiClient.post<ApiEnvelope<MemberGroup>>('/member-groups', input);
    return data.data;
  },
  update: async (id: string, input: Partial<MemberGroupInput>): Promise<MemberGroup> => {
    const { data } = await apiClient.patch<ApiEnvelope<MemberGroup>>(`/member-groups/${id}`, input);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/member-groups/${id}`);
  },
};
