/**
 * Feature-local UI types + tiny factories for Video Studio (P1).
 *
 * P1 is a UI skeleton on a FAKE provider — there is no backend yet, so the whole
 * Project lives in local page state (a draft). Server state (Project CRUD ↔
 * MongoDB via TanStack Query) arrives in P2 (spec §12.1). The domain types are
 * the source of truth; this file only adds id helpers and empty-value factories.
 */
import type { Asset, AssetKind, RunConfig, Scene } from '@/domain/video';
import { defaultRunConfig } from '@/domain/video';

/** Client-only id generator for P1 (the backend will own ids from P2). */
export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Default highlight colours offered to new assets — content, not theme (spec §13.5). */
export const CHARACTER_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
] as const;

/** A blank scene at the given order. */
export function makeScene(order: number, text = ''): Scene {
  return { id: newId('sc'), order, text, characterKeys: [], jobs: [] };
}

/** A blank asset of the given kind, colour chosen round-robin from the palette. */
export function makeAsset(kind: AssetKind, index: number): Asset {
  return {
    id: newId('as'),
    kind,
    key: '',
    displayName: '',
    images: [],
    description: '',
    color: CHARACTER_COLORS[index % CHARACTER_COLORS.length]!,
  };
}

/** The initial draft config — Mock provider so P1 needs no key and spends nothing. */
export function initialConfig(): RunConfig {
  return defaultRunConfig('mock');
}

/** Everything the page owns as a working draft (mirrors a subset of `Project`). */
export interface StudioDraft {
  sourcePrompt: string;
  useMarkers: boolean;
  scenes: Scene[];
  assets: Asset[];
  config: RunConfig;
}
