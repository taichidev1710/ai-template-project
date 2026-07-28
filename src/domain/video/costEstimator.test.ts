import { describe, it, expect } from 'vitest';
import { estimateRunCost, estimateJobCost } from './costEstimator';
import { defaultRunConfig, getSpeedTier, PROVIDER_NANOBANANA, PROVIDER_VEO31 } from './providerCapabilities';
import type { RunConfig } from './types';

const veo = (over: Partial<RunConfig> = {}): RunConfig => ({
  ...defaultRunConfig(PROVIDER_VEO31),
  ...over,
});

const scene = (countOverride?: number) => ({ countOverride });

describe('estimateJobCost', () => {
  it('prices a video tier per second', () => {
    const tier = getSpeedTier(PROVIDER_VEO31, 'fast');
    const c = estimateJobCost(tier, 8);
    expect(c.unit).toBe('second');
    expect(c.perJob).toBeCloseTo(1.2, 5); // 0.15 × 8
    expect(c.priced).toBe(true);
  });

  it('prices an image tier per image, ignoring seconds', () => {
    const tier = getSpeedTier(PROVIDER_NANOBANANA, 'normal');
    const c = estimateJobCost(tier, 8);
    expect(c.unit).toBe('image');
    expect(c.perJob).toBeCloseTo(0.039, 5);
  });

  it('is unpriced for a missing tier', () => {
    expect(estimateJobCost(undefined, 8)).toMatchObject({ priced: false, perJob: 0 });
  });
});

describe('estimateRunCost — video', () => {
  it('multiplies per-job cost by the total job count', () => {
    const cost = estimateRunCost(
      [scene(), scene(2)],
      veo({ speed: 'fast', durationSeconds: 8, count: 1 }),
    );
    expect(cost.totalJobs).toBe(3);
    expect(cost.perJob).toBeCloseTo(1.2, 5);
    expect(cost.total).toBeCloseTo(3.6, 5);
    expect(cost.currency).toBe('USD');
    expect(cost.priced).toBe(true);
  });

  it('flags exceeding the spend cap', () => {
    const over = estimateRunCost([scene(3)], veo({ speed: 'fast', maxCostPerRun: 2 }));
    expect(over.total).toBeCloseTo(3.6, 5);
    expect(over.exceedsCap).toBe(true);

    const under = estimateRunCost([scene(1)], veo({ speed: 'fast', maxCostPerRun: 20 }));
    expect(under.exceedsCap).toBe(false);
  });

  it('prices the quality tier higher than fast', () => {
    const fast = estimateRunCost([scene(1)], veo({ speed: 'fast' }));
    const quality = estimateRunCost([scene(1)], veo({ speed: 'quality' }));
    expect(quality.total).toBeGreaterThan(fast.total);
  });
});

describe('estimateRunCost — image provider', () => {
  it('prices per image and ignores clip duration', () => {
    const cfg = { ...defaultRunConfig(PROVIDER_NANOBANANA), durationSeconds: 8, count: 2 };
    const cost = estimateRunCost([scene()], cfg);
    expect(cost.unit).toBe('image');
    expect(cost.clipSeconds).toBe(0);
    expect(cost.total).toBeCloseTo(0.039 * 2, 5);
  });
});

describe('estimateRunCost — unknown provider', () => {
  it('is unpriced rather than falsely free', () => {
    const cost = estimateRunCost([scene(1)], veo({ providerId: 'does-not-exist' }));
    expect(cost.priced).toBe(false);
    expect(cost.total).toBe(0);
    expect(cost.exceedsCap).toBe(false);
  });
});
