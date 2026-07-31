/** Kiểu dữ liệu cho registry nhà cung cấp — khớp DTO của BE (module `provider`). */

export type AdapterId = 'veo' | 'gemini-image';
export type OutputType = 'video' | 'image';
export type ProviderStatus = 'stable' | 'beta' | 'deprecated';

/** Adapter code hiện có (enum đóng — thêm hãng mới là code-change). */
export const ADAPTER_IDS: AdapterId[] = ['veo', 'gemini-image'];
export const OUTPUT_TYPES: OutputType[] = ['video', 'image'];
export const PROVIDER_STATUSES: ProviderStatus[] = ['stable', 'beta', 'deprecated'];

export interface AspectOption {
  value: string;
  enabled: boolean;
}
export interface DurationOption {
  value: number;
  enabled: boolean;
}
export interface ProviderModelOption {
  id: string;
  tier: string;
  label: string;
  pricePerSecond?: number;
  pricePerImage?: number;
  audio?: boolean;
  maxResolution?: string;
  enabled: boolean;
}

export interface ProviderItem {
  id: string;
  key: string;
  label: string;
  description: string;
  adapterId: string;
  credentialProviderId: string;
  outputType: string;
  enabled: boolean;
  status: string;
  order: number;
  isSystem: boolean;
  aspects: AspectOption[];
  durations: DurationOption[];
  models: ProviderModelOption[];
  maxReferenceImages: number;
  rpm: number;
  maxConcurrent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderInput {
  key: string;
  label: string;
  description?: string;
  adapterId: AdapterId;
  credentialProviderId?: string;
  outputType: OutputType;
  enabled: boolean;
  status?: ProviderStatus;
  order?: number;
  aspects: AspectOption[];
  durations: DurationOption[];
  models: ProviderModelOption[];
  maxReferenceImages?: number;
  rpm?: number;
  maxConcurrent?: number;
}

export interface ProviderListParams {
  page?: number;
  limit?: number;
  search?: string;
  outputType?: OutputType;
}
