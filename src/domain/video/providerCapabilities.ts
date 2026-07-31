/**
 * Provider capability registry + the pure helpers the UI uses to adapt to it.
 *
 * All numbers here (prices, rpm, durations, model ids) are a 07/2026 SNAPSHOT and
 * must be re-verified before real integration (spec header + §2). Keeping them as
 * data — not scattered `if (provider === 'veo')` branches — is the whole point of
 * the adapter layer (spec §5): add a provider by adding a row, and the UI adapts.
 */
import type {
  AspectRatio,
  DelaySeconds,
  PlatformPreset,
  ProviderCapabilities,
  ProviderId,
  RunConfig,
  SpeedTier,
  SpeedTierSpec,
} from './types';
import { DELAY_OPTIONS } from './types';

/* ============================================================
   Known provider ids
   ============================================================ */

export const PROVIDER_VEO31: ProviderId = 'veo31';
export const PROVIDER_NANOBANANA: ProviderId = 'nanobanana';
/** In-app fake used by P1 to build the UX with no key and no spend (spec §17 P1). */
export const PROVIDER_MOCK: ProviderId = 'mock';

/* ============================================================
   Capability data (spec §2.1, §2.2, §7, §11)
   ============================================================ */

/**
 * Google Veo 3.1 — the video core. Async submit→poll→download; no free API tier;
 * priced per second; preview limits ~10 rpm / 10 concurrent (spec §2.1). Speed
 * maps to the three preview models (spec §7). `veo-3.0-*` is deprecated — omitted.
 */
const VEO31: ProviderCapabilities = {
  id: PROVIDER_VEO31,
  label: 'Veo 3.1',
  kind: 'video',
  // Some sources list 1:1; kept conservative to 16:9 / 9:16 (the documented pair).
  aspects: ['16:9', '9:16'],
  durations: [4, 6, 8],
  supportsImageToVideo: true,
  supportsFirstLastFrame: true,
  maxReferenceImages: 3, // "ingredients" — up to ~3 reference images (spec §2.3).
  speedTiers: [
    { tier: 'fast', modelId: 'veo-3.1-fast-generate-preview', pricePerSecond: 0.15, maxResolution: '720p', audio: false },
    { tier: 'normal', modelId: 'veo-3.1-generate-preview', pricePerSecond: 0.4, maxResolution: '1080p', audio: true },
    { tier: 'quality', modelId: 'veo-3.1-generate-preview', pricePerSecond: 0.5, maxResolution: '1080p', audio: true },
  ],
  rpm: 10,
  maxConcurrent: 10,
  credentialProviderId: 'google',
};

/**
 * Nano Banana = Gemini 2.5 Flash Image. Makes/keeps consistent CHARACTER images
 * (not video); fuses up to ~20 reference images; ~$0.039/image (spec §2.2). Its
 * job here is producing character frames to feed Veo image-to-video (spec §9.3).
 */
const NANOBANANA: ProviderCapabilities = {
  id: PROVIDER_NANOBANANA,
  label: 'Nano Banana',
  kind: 'image',
  aspects: ['1:1', '16:9', '9:16'],
  durations: [], // image provider — no clip duration
  supportsImageToVideo: false,
  supportsFirstLastFrame: false,
  maxReferenceImages: 20,
  speedTiers: [{ tier: 'normal', modelId: 'gemini-2.5-flash-image', pricePerImage: 0.039 }],
  rpm: 60,
  maxConcurrent: 10,
  credentialProviderId: 'google',
};

/**
 * A fake, free, keyless provider for P1 (spec §17): simulates async + random
 * errors so the whole UX can be built without spend. Priced at 0.
 */
const MOCK: ProviderCapabilities = {
  id: PROVIDER_MOCK,
  label: 'Mock (thử nghiệm)',
  kind: 'video',
  aspects: ['16:9', '9:16', '1:1'],
  durations: [4, 6, 8],
  supportsImageToVideo: true,
  supportsFirstLastFrame: true,
  maxReferenceImages: 3,
  speedTiers: [
    { tier: 'fast', modelId: 'mock-fast', pricePerSecond: 0 },
    { tier: 'normal', modelId: 'mock-normal', pricePerSecond: 0 },
    { tier: 'quality', modelId: 'mock-quality', pricePerSecond: 0 },
  ],
  rpm: 600,
  maxConcurrent: 4,
};

/**
 * Built-in defaults — khớp seed BE. Dùng khi CHƯA fetch được registry từ API (và cho
 * test). `PROVIDERS` giữ tên cũ = defaults để không vỡ import/test hiện có.
 */
export const DEFAULT_PROVIDERS: readonly ProviderCapabilities[] = [VEO31, NANOBANANA, MOCK];
export const PROVIDERS = DEFAULT_PROVIDERS;

/**
 * Registry HIỆN HÀNH (mutable) — mặc định = built-in, Video Studio nạp từ API
 * (`setProviderRegistry`) để phản ánh cấu hình admin. Mọi helper đọc qua đây nên
 * call-site không đổi.
 */
let activeProviders: readonly ProviderCapabilities[] = DEFAULT_PROVIDERS;
let byId = new Map<ProviderId, ProviderCapabilities>(activeProviders.map((p) => [p.id, p]));

/** Thay registry runtime (danh sách provider đã map từ API, thường kèm MOCK). */
export function setProviderRegistry(list: readonly ProviderCapabilities[]): void {
  activeProviders = list.length > 0 ? list : DEFAULT_PROVIDERS;
  byId = new Map(activeProviders.map((p) => [p.id, p]));
}

/** Toàn bộ provider hiện hành (cho dropdown chọn provider). */
export function getAllProviders(): readonly ProviderCapabilities[] {
  return activeProviders;
}

/* ============================================================
   Lookups
   ============================================================ */

/** Capabilities for a provider id, or `undefined` if unknown. */
export function getCapabilities(providerId: ProviderId): ProviderCapabilities | undefined {
  return byId.get(providerId);
}

/** The tier spec for a provider+speed, or `undefined` if the provider lacks it. */
export function getSpeedTier(providerId: ProviderId, tier: SpeedTier): SpeedTierSpec | undefined {
  return getCapabilities(providerId)?.speedTiers.find((t) => t.tier === tier);
}

/** Whether a provider offers a given speed tier (drives which tiers the UI shows). */
export function supportsSpeed(providerId: ProviderId, tier: SpeedTier): boolean {
  return getSpeedTier(providerId, tier) !== undefined;
}

/** Whether a provider can render an aspect NATIVELY (crop-only 4:5 is never native). */
export function supportsAspect(providerId: ProviderId, aspect: AspectRatio): boolean {
  return getCapabilities(providerId)?.aspects.includes(aspect) ?? false;
}

/* ============================================================
   Safe-delay suggestion (spec §10.2)
   ============================================================ */

/**
 * The smallest delay (whole seconds) that stays at/under the provider's rpm — the
 * REAL reason for delay is respecting the rate limit, not "evading bans" (spec
 * §10.2). rpm 10 → ⌈60/10⌉ = 6s. rpm 0/unknown → 0 (no suggestion).
 */
export function suggestMinDelaySeconds(providerId: ProviderId): number {
  const rpm = getCapabilities(providerId)?.rpm ?? 0;
  return rpm > 0 ? Math.ceil(60 / rpm) : 0;
}

/** The smallest allowed `DelaySeconds` option that is >= the safe minimum. */
export function suggestDelayOption(providerId: ProviderId): DelaySeconds {
  const min = suggestMinDelaySeconds(providerId);
  return DELAY_OPTIONS.find((d) => d >= min) ?? DELAY_OPTIONS[DELAY_OPTIONS.length - 1]!;
}

/* ============================================================
   Platform presets → a valid aspect (+ whether a post-crop is needed) (spec §11)
   ============================================================ */

/** A resolved preset: the aspect to REQUEST, and whether the target needs cropping. */
export interface ResolvedPreset {
  preset: PlatformPreset;
  /** The aspect the provider is actually asked for. */
  requestAspect: AspectRatio;
  /** The final aspect the user wants (may equal `requestAspect`). */
  targetAspect: AspectRatio;
  /** True when `targetAspect` is reached by cropping `requestAspect` afterwards. */
  needsCrop: boolean;
}

/** The native aspect each preset ideally wants (spec §11 table). */
const PRESET_TARGET: Record<PlatformPreset, AspectRatio> = {
  youtube: '16:9',
  facebook: '16:9',
  tiktok: '9:16',
  reels: '9:16',
  shorts: '9:16',
  'instagram-feed': '1:1',
  'instagram-portrait': '4:5',
};

/**
 * Resolve a platform preset against a provider. If the provider renders the
 * target aspect natively, request it directly. Otherwise pick the closest
 * supported aspect to crop FROM (4:5 ← crop a 9:16 or 1:1) and flag `needsCrop`,
 * so the UI can say "render 9:16 then crop" instead of pretending 4:5 is native
 * (spec §11). Returns `undefined` for an unknown provider.
 */
export function resolvePreset(
  providerId: ProviderId,
  preset: PlatformPreset,
): ResolvedPreset | undefined {
  const caps = getCapabilities(providerId);
  if (!caps) return undefined;
  const target = PRESET_TARGET[preset];

  if (caps.aspects.includes(target)) {
    return { preset, requestAspect: target, targetAspect: target, needsCrop: false };
  }
  // Not native: crop from the nearest taller/square source the provider does have.
  const cropFrom = pickCropSource(target, caps.aspects);
  return { preset, requestAspect: cropFrom, targetAspect: target, needsCrop: true };
}

/** Choose which supported aspect to crop a non-native target out of. */
function pickCropSource(target: AspectRatio, supported: readonly AspectRatio[]): AspectRatio {
  // 4:5 (portrait, taller than square) is best cropped from 9:16, else 1:1, else 16:9.
  const preference: AspectRatio[] =
    target === '4:5' ? ['9:16', '1:1', '16:9'] : ['16:9', '1:1', '9:16'];
  return preference.find((a) => supported.includes(a)) ?? supported[0] ?? target;
}

/* ============================================================
   Sensible default RunConfig for a provider
   ============================================================ */

/**
 * A ready-to-use `RunConfig` for a provider: its first available speed tier and
 * aspect, a safe default delay, concurrency clamped to the provider, and spend
 * guards on. The UI seeds a new Project from this rather than inventing values.
 */
export function defaultRunConfig(providerId: ProviderId = PROVIDER_VEO31): RunConfig {
  const caps = getCapabilities(providerId) ?? VEO31;
  const speed: SpeedTier = caps.speedTiers[0]?.tier ?? 'normal';
  const tier = caps.speedTiers[0];
  const aspect: AspectRatio = caps.aspects[0] ?? '16:9';
  const durationSeconds = caps.durations[caps.durations.length - 1] ?? 8;
  return {
    providerId: caps.id,
    modelId: tier?.modelId ?? '',
    source: 'api',
    speed,
    count: 1,
    aspect,
    durationSeconds,
    runMode: 'sequential',
    delaySeconds: suggestDelayOption(caps.id),
    concurrency: Math.min(2, caps.maxConcurrent),
    audio: tier?.audio ?? false,
    maxCostPerRun: 20,
    maxJobsPerRun: 40,
  };
}
