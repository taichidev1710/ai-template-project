import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { Role, RoleInput, RolesListParams } from '../types';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const rolesApi = {
  list: async (params: RolesListParams): Promise<{ items: Role[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<Role[]> & { meta: ListMeta }>('/roles', {
      params,
    });
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  create: async (input: RoleInput): Promise<Role> => {
    const { data } = await apiClient.post<ApiEnvelope<Role>>('/roles', input);
    return data.data;
  },
  update: async (id: string, input: Partial<RoleInput>): Promise<Role> => {
    const { data } = await apiClient.patch<ApiEnvelope<Role>>(`/roles/${id}`, input);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },
};
