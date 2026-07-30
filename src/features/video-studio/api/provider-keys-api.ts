import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';

/**
 * API layer cho "credential của chính user" (BYOK). Credential lưu theo VENDOR
 * (xem `domain/video/credentialProviders`): `google` bao Gemini/Veo/Nano Banana.
 * Mỗi vendor có bộ field riêng nên body là `{ fields }` (map field→giá trị). Backend
 * lưu ĐÃ MÃ HOÁ per-user; không bao giờ trả lại giá trị — chỉ `last4` + tên field.
 * Đây là NƠI DUY NHẤT biết URL các endpoint này (rule §5).
 */

/** Vendor credential (string mở — khớp id trong credentialProviders registry). */
export type KeyProvider = string;

/** Trạng thái một credential đã cấu hình (an toàn để hiển thị). */
export interface ProviderKeyDto {
  provider: KeyProvider;
  last4: string;
  configured: true;
  /** Tên các field đã đặt (không kèm giá trị). */
  fieldsSet: string[];
  updatedAt: string;
}

export const providerKeysApi = {
  list: async (): Promise<ProviderKeyDto[]> => {
    const { data } = await apiClient.get<ApiEnvelope<ProviderKeyDto[]>>('/provider-keys');
    return data.data;
  },
  set: async (provider: KeyProvider, fields: Record<string, string>): Promise<ProviderKeyDto> => {
    const { data } = await apiClient.put<ApiEnvelope<ProviderKeyDto>>(
      `/provider-keys/${provider}`,
      { fields },
    );
    return data.data;
  },
  remove: async (provider: KeyProvider): Promise<void> => {
    await apiClient.delete(`/provider-keys/${provider}`);
  },
};
