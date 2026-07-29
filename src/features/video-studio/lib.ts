/** Small presentation helpers for the feature (formatting only — no business logic). */
import type { TFunction } from 'i18next';
import type { Asset, AssetKind } from '@/domain/video';

/** Format a USD estimate for display. Tiny amounts keep 3 decimals (e.g. $0.039). */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount !== 0 && Math.abs(amount) < 1 ? 3 : 2,
  }).format(amount);
}

const KIND_LABEL_KEY: Record<AssetKind, string> = {
  character: 'asset.kindCharacter',
  setting: 'asset.kindSetting',
  style: 'asset.kindStyle',
  prompt: 'asset.kindPrompt',
};

/** Short chip label for an asset: `@key` for characters, else the display name
 * (falling back to `@key`, then the kind name) — so settings/styles/prompt blocks
 * always show something readable. */
export function assetTagLabel(asset: Asset, t: TFunction<'video-studio'>): string {
  if (asset.kind === 'character') return `@${asset.key}`;
  return asset.displayName || (asset.key ? `@${asset.key}` : t(KIND_LABEL_KEY[asset.kind]));
}
