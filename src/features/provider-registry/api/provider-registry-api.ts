import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { ProviderItem, ProviderInput, ProviderListParams } from '../types';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const providerRegistryApi = {
  list: async (params: ProviderListParams): Promise<{ items: ProviderItem[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<ProviderItem[]> & { meta: ListMeta }>(
      '/providers',
      { params },
    );
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  create: async (input: ProviderInput): Promise<ProviderItem> => {
    const { data } = await apiClient.post<ApiEnvelope<ProviderItem>>('/providers', input);
    return data.data;
  },
  update: async (id: string, input: Partial<ProviderInput>): Promise<ProviderItem> => {
    const { data } = await apiClient.patch<ApiEnvelope<ProviderItem>>(`/providers/${id}`, input);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/providers/${id}`);
  },
};
