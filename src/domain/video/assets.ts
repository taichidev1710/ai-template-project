/**
 * Reference-asset resolution (spec §2.3, §9) — how a scene's `@key` mentions and
 * its ASSIGNED assets combine into one reference list, and which asset/scene
 * mismatches to warn about.
 *
 * Pure: no React, no I/O. Two ways attach an asset to a scene (spec decision):
 *   1. an inline `@key` in the scene text — the character convention;
 *   2. an assignment in `Scene.assetIds` — a setting/style applied to a group.
 * Both are unioned here; the outgoing prompt still strips `@` (see characterTagger).
 */
import { characterKeysInText } from './characterTagger';
import type { Asset } from './types';

/** Just the parts of a `Scene` that decide its references. A full `Scene` fits. */
export interface AssetScene {
  text: string;
  assetIds?: string[];
}

/**
 * The assets a scene references, in order: `@key` mentions first (text order),
 * then assigned assets (assignment order), deduplicated by id. An `@key` or an
 * assetId that matches no asset is skipped.
 */
export function sceneAssets(scene: AssetScene, assets: readonly Asset[]): Asset[] {
  const byKey = new Map(assets.map((a) => [a.key.toLowerCase(), a]));
  const byId = new Map(assets.map((a) => [a.id, a]));
  const out: Asset[] = [];
  const seen = new Set<string>();
  const add = (asset: Asset | undefined) => {
    if (asset && !seen.has(asset.id)) {
      seen.add(asset.id);
      out.push(asset);
    }
  };
  for (const key of characterKeysInText(scene.text)) add(byKey.get(key));
  for (const id of scene.assetIds ?? []) add(byId.get(id));
  return out;
}

/** True when an asset carries usable content — a reference image OR text. */
function hasContent(asset: Asset): boolean {
  return asset.images.length > 0 || (asset.description?.trim().length ?? 0) > 0;
}

/**
 * The outgoing text prompt for a scene: its own text, followed by the text
 * `description` of every referenced asset (in `sceneAssets` order), each as its
 * own paragraph. This is how a `style` described in words, a character/setting
 * text description, or a shared `prompt`-kind block reaches the provider when
 * there is no image (spec §9.3, level-3 text sync). `@key` markers stay untouched
 * here — `buildScenePrompt` strips them when the final request is assembled.
 */
export function composeScenePrompt(scene: AssetScene, assets: readonly Asset[]): string {
  const parts: string[] = [];
  const base = scene.text.trim();
  if (base) parts.push(base);
  for (const a of sceneAssets(scene, assets)) {
    const d = a.description?.trim();
    if (d) parts.push(d);
  }
  return parts.join('\n\n');
}

/** A code the UI maps to a `t('...')` warning — never localised prose here (§13.5). */
export type AssetIssueCode =
  /** An asset is referenced (mentioned or assigned) but has no reference image. */
  | 'missing-image'
  /** An asset has an image but is neither mentioned nor assigned anywhere. */
  | 'unused-asset'
  /** A `@token` is mentioned that matches no defined asset. */
  | 'unknown-key';

export interface AssetIssue {
  code: AssetIssueCode;
  /** The asset this concerns (absent for `unknown-key`). */
  assetId?: string;
  key: string;
}

/**
 * Cross-check the asset roster against the scenes (spec §9.2, generalised to all
 * asset kinds). An asset counts as USED if its `@key` appears in any scene text
 * OR its id is assigned to any scene. Returns codes for the UI to translate:
 * asset issues follow the roster order, then unknown keys in first-appearance
 * order.
 */
export function checkAssets(
  assets: readonly Asset[],
  scenes: readonly AssetScene[],
): AssetIssue[] {
  const known = new Set(assets.map((a) => a.key.toLowerCase()));
  const mentioned = new Set<string>();
  const assigned = new Set<string>();
  const unknownOrder: string[] = [];
  const seenUnknown = new Set<string>();

  for (const scene of scenes) {
    for (const key of characterKeysInText(scene.text)) {
      mentioned.add(key);
      if (!known.has(key) && !seenUnknown.has(key)) {
        seenUnknown.add(key);
        unknownOrder.push(key);
      }
    }
    for (const id of scene.assetIds ?? []) assigned.add(id);
  }

  const issues: AssetIssue[] = [];
  for (const a of assets) {
    const used = mentioned.has(a.key.toLowerCase()) || assigned.has(a.id);
    // "Content" is a reference image OR a text description (level-3 text sync),
    // so a text-only style/prompt asset is not flagged as image-less.
    const filled = hasContent(a);
    if (used && !filled) issues.push({ code: 'missing-image', assetId: a.id, key: a.key });
    else if (!used && filled) issues.push({ code: 'unused-asset', assetId: a.id, key: a.key });
  }
  for (const key of unknownOrder) issues.push({ code: 'unknown-key', key });
  return issues;
}
