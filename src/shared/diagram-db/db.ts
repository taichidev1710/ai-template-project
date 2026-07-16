/**
 * In-memory mock "backend" for the diagram domain.
 *
 * The primary table is `templates` (Loại sơ đồ) — each is a SELF-CONTAINED
 * bundle owning its own block types + relations + rule sets. Block types /
 * relations / rule sets are always accessed THROUGH their owning type, so a
 * rule always references vocabulary that exists in the same bundle. Swap these
 * tables for real `apiClient` calls when a backend exists.
 */
import type { ListParams, Paginated } from '@/shared/api';
import { BUILTIN_TEMPLATES, type Diagram, type DiagramTemplate } from '@/domain/diagram';

const clone = <T>(v: T): T => structuredClone(v);

export const tables = {
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

/** Find a Loại sơ đồ by id or throw (used by the type-scoped catalog apis). */
export function getTypeOrThrow(typeId: string): DiagramTemplate {
  const t = tables.templates.find((x) => x.id === typeId);
  if (!t) throw new Error('Diagram type not found');
  return t;
}
