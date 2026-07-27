import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { PermissionGroup, PermissionGroupInput, GroupListParams } from '../types';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const permissionGroupsApi = {
  list: async (
    params: GroupListParams,
  ): Promise<{ items: PermissionGroup[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<PermissionGroup[]> & { meta: ListMeta }>(
      '/permission-groups',
      { params },
    );
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  create: async (input: PermissionGroupInput): Promise<PermissionGroup> => {
    const { data } = await apiClient.post<ApiEnvelope<PermissionGroup>>('/permission-groups', input);
    return data.data;
  },
  update: async (id: string, input: Partial<PermissionGroupInput>): Promise<PermissionGroup> => {
    const { data } = await apiClient.patch<ApiEnvelope<PermissionGroup>>(
      `/permission-groups/${id}`,
      input,
    );
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/permission-groups/${id}`);
  },
};
