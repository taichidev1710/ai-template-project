import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { User, UserInput, UsersListParams } from '../types';
import type { UserStatus } from '@/shared/stores/auth-store';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Feature API layer for users — the only place that knows these URLs.
 * The backend wraps responses in { success, data, meta? }; unwrap here.
 */
export const usersApi = {
  list: async (params: UsersListParams): Promise<{ items: User[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<User[]> & { meta: ListMeta }>('/users', {
      params,
    });
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  create: async (input: UserInput): Promise<User> => {
    const { data } = await apiClient.post<ApiEnvelope<User>>('/users', input);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
  assignRoles: async (id: string, roleIds: string[]): Promise<void> => {
    await apiClient.put(`/users/${id}/roles`, { roleIds });
  },
  assignGroups: async (id: string, groupIds: string[]): Promise<void> => {
    await apiClient.put(`/users/${id}/permission-groups`, { groupIds });
  },
  setExtraPermissions: async (id: string, grants: string[]): Promise<void> => {
    await apiClient.put(`/users/${id}/extra-permissions`, { grants });
  },
  setStatus: async (id: string, status: Extract<UserStatus, 'active' | 'disabled'>): Promise<void> => {
    await apiClient.patch(`/users/${id}/status`, { status });
  },
};
