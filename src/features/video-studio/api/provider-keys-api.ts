import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';

/**
 * API layer cho "khóa API của chính user" (BYOK). Backend lưu key ĐÃ MÃ HOÁ theo
 * từng user; không bao giờ trả lại key gốc — chỉ `last4` để hiển thị `••••1234`.
 * Đây là NƠI DUY NHẤT biết URL các endpoint này (rule §5).
 */

/** Provider của credential — hiện chỉ Google (một key bao Gemini/Veo/Nano Banana). */
export type KeyProvider = 'google';

/** Trạng thái một key đã cấu hình (an toàn để hiển thị). */
export interface ProviderKeyDto {
  provider: KeyProvider;
  last4: string;
  configured: true;
  updatedAt: string;
}

export const providerKeysApi = {
  list: async (): Promise<ProviderKeyDto[]> => {
    const { data } = await apiClient.get<ApiEnvelope<ProviderKeyDto[]>>('/provider-keys');
    return data.data;
  },
  set: async (provider: KeyProvider, key: string): Promise<ProviderKeyDto> => {
    const { data } = await apiClient.put<ApiEnvelope<ProviderKeyDto>>(
      `/provider-keys/${provider}`,
      { key },
    );
    return data.data;
  },
  remove: async (provider: KeyProvider): Promise<void> => {
    await apiClient.delete(`/provider-keys/${provider}`);
  },
};
