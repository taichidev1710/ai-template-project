import { apiClient } from '@/shared/api';
import type { Paginated } from '@/shared/api';
import type { User, UserInput, UsersListParams } from '../types';

/**
 * Feature API layer: the ONLY place that knows the endpoint URLs for users.
 * Hooks call these functions; components never call the API directly.
 */
export const usersApi = {
  list: async (params: UsersListParams): Promise<Paginated<User>> => {
    const { data } = await apiClient.get<Paginated<User>>('/users', { params });
    return data;
  },
  get: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },
  create: async (input: UserInput): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', input);
    return data;
  },
  update: async (id: string, input: UserInput): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, input);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
