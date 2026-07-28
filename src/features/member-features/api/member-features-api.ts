import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { MemberFeatureItem, MemberFeatureInput, MemberFeatureListParams } from '../types';

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const memberFeaturesApi = {
  list: async (
    params: MemberFeatureListParams,
  ): Promise<{ items: MemberFeatureItem[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<MemberFeatureItem[]> & { meta: ListMeta }>(
      '/member-features',
      { params },
    );
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  create: async (input: MemberFeatureInput): Promise<MemberFeatureItem> => {
    const { data } = await apiClient.post<ApiEnvelope<MemberFeatureItem>>('/member-features', input);
    return data.data;
  },
  update: async (id: string, input: Partial<MemberFeatureInput>): Promise<MemberFeatureItem> => {
    const { data } = await apiClient.patch<ApiEnvelope<MemberFeatureItem>>(
      `/member-features/${id}`,
      input,
    );
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/member-features/${id}`);
  },
};
