import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { TierItem, TierInput, TierListParams } from '../types';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const tiersApi = {
  list: async (params: TierListParams): Promise<{ items: TierItem[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<TierItem[]> & { meta: ListMeta }>('/tiers', {
      params,
    });
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  create: async (input: TierInput): Promise<TierItem> => {
    const { data } = await apiClient.post<ApiEnvelope<TierItem>>('/tiers', input);
    return data.data;
  },
  update: async (id: string, input: Partial<TierInput>): Promise<TierItem> => {
    const { data } = await apiClient.patch<ApiEnvelope<TierItem>>(`/tiers/${id}`, input);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/tiers/${id}`);
  },
};
