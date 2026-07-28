import { describe, it, expect } from 'vitest';
import {
  PROVIDERS,
  PROVIDER_VEO31,
  PROVIDER_NANOBANANA,
  PROVIDER_MOCK,
  getCapabilities,
  getSpeedTier,
  supportsSpeed,
  supportsAspect,
  suggestMinDelaySeconds,
  suggestDelayOption,
  resolvePreset,
  defaultRunConfig,
} from './providerCapabilities';
import { DELAY_OPTIONS } from './types';

describe('registry lookups', () => {
  it('exposes Veo, Nano Banana and the mock', () => {
    expect(PROVIDERS.map((p) => p.id)).toEqual([PROVIDER_VEO31, PROVIDER_NANOBANANA, PROVIDER_MOCK]);
  });
  it('returns undefined for an unknown provider', () => {
    expect(getCapabilities('nope')).toBeUndefined();
  });
  it('maps speed to the provider model id', () => {
    expect(getSpeedTier(PROVIDER_VEO31, 'fast')?.modelId).toBe('veo-3.1-fast-generate-preview');
    expect(getSpeedTier(PROVIDER_VEO31, 'quality')?.modelId).toBe('veo-3.1-generate-preview');
  });
  it('reports which speeds/aspects a provider offers', () => {
    expect(supportsSpeed(PROVIDER_NANOBANANA, 'normal')).toBe(true);
    expect(supportsSpeed(PROVIDER_NANOBANANA, 'quality')).toBe(false);
    expect(supportsAspect(PROVIDER_VEO31, '16:9')).toBe(true);
    expect(supportsAspect(PROVIDER_VEO31, '1:1')).toBe(false); // Veo: 16:9 / 9:16 only
  });
});

describe('safe delay suggestion (spec §10.2)', () => {
  it('derives the minimum whole-second delay from rpm', () => {
    expect(suggestMinDelaySeconds(PROVIDER_VEO31)).toBe(6); // 60 / 10
    expect(suggestMinDelaySeconds(PROVIDER_NANOBANANA)).toBe(1); // 60 / 60
    expect(suggestMinDelaySeconds('nope')).toBe(0);
  });
  it('picks the smallest allowed option at or above the minimum', () => {
    const opt = suggestDelayOption(PROVIDER_VEO31);
    expect(DELAY_OPTIONS).toContain(opt);
    expect(opt).toBe(15); // smallest option >= 6
  });
});

describe('resolvePreset (spec §11)', () => {
  it('requests a native aspect directly, no crop', () => {
    expect(resolvePreset(PROVIDER_VEO31, 'youtube')).toEqual({
      preset: 'youtube',
      requestAspect: '16:9',
      targetAspect: '16:9',
      needsCrop: false,
    });
    expect(resolvePreset(PROVIDER_VEO31, 'tiktok')?.requestAspect).toBe('9:16');
  });

  it('flags a crop when the target aspect is not native', () => {
    const r = resolvePreset(PROVIDER_VEO31, 'instagram-portrait'); // 4:5, Veo can't do it
    expect(r?.targetAspect).toBe('4:5');
    expect(r?.needsCrop).toBe(true);
    expect(r?.requestAspect).toBe('9:16'); // crop 4:5 out of 9:16
  });

  it('needs no crop when the provider supports the target natively', () => {
    expect(resolvePreset(PROVIDER_MOCK, 'instagram-feed')).toMatchObject({
      requestAspect: '1:1',
      needsCrop: false,
    });
  });

  it('returns undefined for an unknown provider', () => {
    expect(resolvePreset('nope', 'youtube')).toBeUndefined();
  });
});

describe('defaultRunConfig', () => {
  it('seeds a valid config for the provider', () => {
    const cfg = defaultRunConfig(PROVIDER_VEO31);
    const caps = getCapabilities(PROVIDER_VEO31)!;
    expect(cfg.providerId).toBe(PROVIDER_VEO31);
    expect(caps.aspects).toContain(cfg.aspect);
    expect(caps.speedTiers.some((t) => t.tier === cfg.speed)).toBe(true);
    expect(cfg.concurrency).toBeLessThanOrEqual(caps.maxConcurrent);
    expect(DELAY_OPTIONS).toContain(cfg.delaySeconds);
    expect(cfg.maxCostPerRun).toBeGreaterThan(0);
  });

  it('falls back to Veo for an unknown provider', () => {
    expect(defaultRunConfig('nope').providerId).toBe(PROVIDER_VEO31);
  });
});
