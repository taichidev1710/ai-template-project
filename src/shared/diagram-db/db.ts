/**
 * In-memory mock "backend" for the diagram domain — the shared library that
 * every diagram feature (block-types, relation-types, rule-sets, diagrams)
 * reads and writes. Seeded from the built-in presets. Swap these tables for
 * real `apiClient` calls when a backend exists; the feature api layers are the
 * only callers, so nothing else changes.
 */
import type { ListParams, Paginated } from '@/shared/api';
import {
  BUILTIN_BLOCK_TYPES,
  BUILTIN_RELATIONS,
  BUILTIN_RULE_SETS,
  BUILTIN_TEMPLATES,
  type BlockType,
  type Diagram,
  type DiagramTemplate,
  type Relation,
  type RuleSet,
} from '@/domain/diagram';

const clone = <T>(v: T): T => structuredClone(v);

/** Mutable tables. Module-level so all features share one library instance. */
export const tables = {
  blockTypes: clone(BUILTIN_BLOCK_TYPES) as BlockType[],
  relations: clone(BUILTIN_RELATIONS) as Relation[],
  ruleSets: clone(BUILTIN_RULE_SETS) as RuleSet[],
  templates: clone(BUILTIN_TEMPLATES) as DiagramTemplate[],
  diagrams: [] as Diagram[],
};

export const delay = (ms = 200): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Case-insensitive substring match across the given fields. */
function matches(text: string, fields: string[]): boolean {
  const q = text.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => f.toLowerCase().includes(q));
}

/** Filter + paginate an array the way a list endpoint would. */
export function paginate<T>(rows: T[], params: ListParams, searchFields: (row: T) => string[]): Paginated<T> {
  const { page = 1, pageSize = 10, search = '' } = params;
  const filtered = search ? rows.filter((r) => matches(search, searchFields(r))) : rows;
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize };
}

/** Short unique-ish id with a prefix (mock only). */
export function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}
