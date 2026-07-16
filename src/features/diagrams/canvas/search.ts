/**
 * Node search for the canvas. Pure — no React, no cytoscape.
 *
 * Vietnamese needs accent-insensitive matching (the demo's `noDia`): typing
 * "cha" must find "Chả", and "vo" must find "Vợ", because nobody types accents
 * into a search box.
 */
import type { DiagramNode } from '@/domain/diagram';

/** Lowercase + strip Vietnamese diacritics (and đ/Đ, which NFD does not split). */
export function noDia(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export interface NodeMatch {
  id: string;
  label: string;
  blockTypeId: string;
}

/**
 * Nodes whose label or notes contain `query`, accent-insensitively.
 * Empty query = no matches (the box is a filter, not a full listing).
 */
export function searchNodes(nodes: DiagramNode[], query: string, limit = 8): NodeMatch[] {
  const q = noDia(query.trim());
  if (!q) return [];
  const out: NodeMatch[] = [];
  for (const n of nodes) {
    if (out.length >= limit) break;
    if (noDia(n.label).includes(q) || noDia(n.notes ?? '').includes(q)) {
      out.push({ id: n.id, label: n.label, blockTypeId: n.blockTypeId });
    }
  }
  return out;
}
