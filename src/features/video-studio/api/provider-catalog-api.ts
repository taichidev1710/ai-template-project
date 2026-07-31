import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';

/** Shape provider trả từ BE `GET /video-projects/providers` (khớp ProviderDto). */
export interface CatalogModel {
  id: string;
  tier: string;
  label: string;
  pricePerSecond?: number;
  pricePerImage?: number;
  audio?: boolean;
  maxResolution?: string;
  enabled: boolean;
}
export interface CatalogProvider {
  id: string;
  key: string;
  label: string;
  adapterId: string;
  credentialProviderId: string;
  outputType: string;
  enabled: boolean;
  status: string;
  order: number;
  isSystem: boolean;
  aspects: Array<{ value: string; enabled: boolean }>;
  durations: Array<{ value: number; enabled: boolean }>;
  models: CatalogModel[];
  maxReferenceImages: number;
  rpm: number;
  maxConcurrent: number;
}

export const providerCatalogApi = {
  /** Danh sách provider ĐANG BẬT (đã trộn default built-in) cho Video Studio. */
  listEnabled: async (): Promise<CatalogProvider[]> => {
    const { data } = await apiClient.get<ApiEnvelope<CatalogProvider[]>>('/video-projects/providers');
    return data.data;
  },
};
