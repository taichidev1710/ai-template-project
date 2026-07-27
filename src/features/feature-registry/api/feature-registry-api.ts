import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { FeatureItem, FeatureInput, FeatureListParams } from '../types';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const featureRegistryApi = {
  list: async (params: FeatureListParams): Promise<{ items: FeatureItem[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<FeatureItem[]> & { meta: ListMeta }>(
      '/features',
      { params },
    );
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  create: async (input: FeatureInput): Promise<FeatureItem> => {
    const { data } = await apiClient.post<ApiEnvelope<FeatureItem>>('/features', input);
    return data.data;
  },
  update: async (id: string, input: Partial<FeatureInput>): Promise<FeatureItem> => {
    const { data } = await apiClient.patch<ApiEnvelope<FeatureItem>>(`/features/${id}`, input);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/features/${id}`);
  },
};
