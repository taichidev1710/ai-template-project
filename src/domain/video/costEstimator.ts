/**
 * Cost estimation (spec §4.2, §7) — the numbers behind "Tạo N video · ~$X" and
 * the spend cap that stops a batch from burning the wallet.
 *
 * Pure. Video tiers price per SECOND of output × clip length × job count; image
 * providers (Nano Banana) price per IMAGE. Job counts come from `runPlan` so the
 * estimate can never disagree with what actually runs (spec §15). Amounts are
 * floating USD estimates — round for DISPLAY in the UI (`Intl.NumberFormat`).
 */
import type { RunConfig, SpeedTierSpec } from './types';
import { getSpeedTier } from './providerCapabilities';
import { countJobs, type PlannableScene } from './runPlan';

export interface CostBreakdown {
  currency: string;
  totalJobs: number;
  /** Clip length priced (video), 0 for image providers. */
  clipSeconds: number;
  /** What `unitPrice` is measured in. */
  unit: 'second' | 'image';
  /** USD per second (video) or per image (image). */
  unitPrice: number;
  /** Estimated cost of one job. */
  perJob: number;
  /** Estimated cost of the whole batch = `perJob × totalJobs`. */
  total: number;
  /** Spend cap from `RunConfig.maxCostPerRun`, if set (USD). */
  cap?: number;
  /** True when priced AND `total` exceeds `cap` — the UI should gate on this. */
  exceedsCap: boolean;
  /**
   * False when the provider/tier has no known price (unknown provider, or a
   * mock): `total` is then 0 and the UI shows "—" instead of "$0", so a missing
   * price is never mistaken for "free".
   */
  priced: boolean;
}

/** Cost of one job for a given tier + clip length. Returns 0 when unpriced. */
export function estimateJobCost(
  tier: SpeedTierSpec | undefined,
  clipSeconds: number,
): { unit: 'second' | 'image'; unitPrice: number; perJob: number; priced: boolean } {
  if (tier?.pricePerSecond !== undefined) {
    return { unit: 'second', unitPrice: tier.pricePerSecond, perJob: tier.pricePerSecond * clipSeconds, priced: true };
  }
  if (tier?.pricePerImage !== undefined) {
    return { unit: 'image', unitPrice: tier.pricePerImage, perJob: tier.pricePerImage, priced: true };
  }
  return { unit: 'second', unitPrice: 0, perJob: 0, priced: false };
}

/**
 * Estimate the full batch cost (spec §4.2). Resolves the tier from
 * provider+speed, prices one job, multiplies by the job count, and compares to
 * the spend cap. Image providers ignore `durationSeconds`. An unknown/free tier
 * yields `priced: false` so the UI can distinguish "unknown" from "$0".
 */
export function estimateRunCost(
  scenes: readonly Pick<PlannableScene, 'countOverride'>[],
  config: RunConfig,
): CostBreakdown {
  const tier = getSpeedTier(config.providerId, config.speed);
  const totalJobs = countJobs(scenes, config);
  const isImage = tier?.pricePerImage !== undefined && tier.pricePerSecond === undefined;
  const clipSeconds = isImage ? 0 : config.durationSeconds;

  const { unit, unitPrice, perJob, priced } = estimateJobCost(tier, clipSeconds);
  const total = perJob * totalJobs;
  const cap = config.maxCostPerRun;
  const exceedsCap = priced && cap !== undefined && total > cap;

  return { currency: 'USD', totalJobs, clipSeconds, unit, unitPrice, perJob, total, cap, exceedsCap, priced };
}
