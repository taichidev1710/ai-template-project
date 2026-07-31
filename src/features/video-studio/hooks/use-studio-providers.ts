import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_PROVIDERS,
  PROVIDER_MOCK,
  setProviderRegistry,
  type AspectRatio,
  type ProviderCapabilities,
  type SpeedTier,
  type SpeedTierSpec,
} from '@/domain/video';
import { providerCatalogApi, type CatalogProvider } from '../api/provider-catalog-api';

/** Map một provider từ API sang `ProviderCapabilities` mà UI đang dùng. */
function toCaps(dto: CatalogProvider): ProviderCapabilities {
  const kind = dto.outputType === 'image' ? 'image' : 'video';
  const speedTiers: SpeedTierSpec[] = dto.models
    .filter((m) => m.enabled)
    .map((m) => ({
      tier: m.tier as SpeedTier,
      modelId: m.id,
      ...(m.pricePerSecond !== undefined ? { pricePerSecond: m.pricePerSecond } : {}),
      ...(m.pricePerImage !== undefined ? { pricePerImage: m.pricePerImage } : {}),
      ...(m.maxResolution ? { maxResolution: m.maxResolution } : {}),
      ...(m.audio !== undefined ? { audio: m.audio } : {}),
    }));
  return {
    id: dto.key,
    label: dto.label,
    kind,
    aspects: dto.aspects.filter((a) => a.enabled).map((a) => a.value as AspectRatio),
    durations: dto.durations.filter((d) => d.enabled).map((d) => d.value),
    // Cờ năng lực Veo suy từ kiểu đầu ra (registry chưa lưu riêng — video mới có i2v).
    supportsImageToVideo: kind === 'video',
    supportsFirstLastFrame: kind === 'video',
    maxReferenceImages: dto.maxReferenceImages,
    speedTiers,
    rpm: dto.rpm,
    maxConcurrent: dto.maxConcurrent,
    ...(dto.credentialProviderId ? { credentialProviderId: dto.credentialProviderId } : {}),
  };
}

/**
 * Nạp catalog provider đang bật từ API vào registry runtime của domain (để mọi helper
 * `getCapabilities`/cost/plan phản ánh cấu hình admin). MOCK (fake keyless) LUÔN được
 * thêm để test không tốn tiền. Chưa fetch xong → dùng built-in defaults.
 */
export function useStudioProviders(): {
  providers: readonly ProviderCapabilities[];
  isLoading: boolean;
  isError: boolean;
} {
  const query = useQuery({
    queryKey: ['video-studio', 'providers'],
    queryFn: providerCatalogApi.listEnabled,
    staleTime: 60_000,
  });

  const providers = useMemo(() => {
    const mock = DEFAULT_PROVIDERS.find((p) => p.id === PROVIDER_MOCK);
    const list = query.data
      ? [...query.data.map(toCaps), ...(mock ? [mock] : [])]
      : [...DEFAULT_PROVIDERS];
    // Cập nhật registry runtime NGAY trong render cha → component con đọc được caps mới.
    setProviderRegistry(list);
    return list;
  }, [query.data]);

  return { providers, isLoading: query.isLoading, isError: query.isError };
}
