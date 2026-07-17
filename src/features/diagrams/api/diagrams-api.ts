import type { Paginated } from '@/shared/api';
import { defaultVisibility, generateSample, type Diagram } from '@/domain/diagram';
import { delay, genId, getTypeOrThrow, paginate, tables } from '@/shared/diagram-db/db';
import type { DiagramContentInput, DiagramCreateInput, DiagramInput, DiagramsListParams } from '../types';

function findOrThrow(id: string): Diagram {
  const found = tables.diagrams.find((d) => d.id === id);
  if (!found) throw new Error('Diagram not found');
  return found;
}

/**
 * A diagram may only apply rule sets belonging to ITS Loại sơ đồ — the type owns
 * the vocabulary, so a rule set from another type would reference block types and
 * relations this diagram has no access to. Drop anything out of scope.
 */
function scopedRuleSetIds(templateId: string, ruleSetIds: string[]): string[] {
  const owned = new Set(getTypeOrThrow(templateId).ruleSets.map((rs) => rs.id));
  return ruleSetIds.filter((id) => owned.has(id));
}

/** Feature API layer — CRUD over diagrams (Sơ đồ). */
export const diagramsApi = {
  list: async (params: DiagramsListParams): Promise<Paginated<Diagram>> => {
    await delay();
    const rows = params.templateId
      ? tables.diagrams.filter((d) => d.templateId === params.templateId)
      : tables.diagrams;
    return paginate(rows, params, (d) => [d.name, d.id]);
  },

  get: async (id: string): Promise<Diagram> => {
    await delay();
    return findOrThrow(id);
  },

  create: async (input: DiagramCreateInput): Promise<Diagram> => {
    await delay();
    const now = new Date().toISOString();
    const ruleSetIds = scopedRuleSetIds(input.templateId, input.ruleSetIds);
    // Seeded against the ticked sets only, so the sample obeys exactly the rules
    // this diagram will be judged by.
    const content = input.withSample
      ? generateSample(getTypeOrThrow(input.templateId), ruleSetIds)
      : { nodes: [], edges: [] };
    const created: Diagram = {
      id: genId('dg'),
      name: input.name,
      templateId: input.templateId,
      nodes: content.nodes,
      edges: content.edges,
      ruleSetIds,
      localRules: [],
      visibility: defaultVisibility(),
      createdAt: now,
      updatedAt: now,
    };
    tables.diagrams = [created, ...tables.diagrams];
    return created;
  },

  update: async (id: string, input: DiagramInput): Promise<Diagram> => {
    await delay();
    const existing = findOrThrow(id);
    // Keep nodes/edges/visibility; patch only the header fields the form owns.
    existing.name = input.name;
    existing.templateId = input.templateId;
    existing.ruleSetIds = scopedRuleSetIds(input.templateId, input.ruleSetIds);
    existing.updatedAt = new Date().toISOString();
    return existing;
  },

  /**
   * Write back what the canvas owns. Kept separate from `update` because the two
   * have different writers (form vs canvas) and must not clobber each other:
   * saving the canvas must never touch the name/type/rule sets, and vice versa.
   */
  saveContent: async (id: string, content: DiagramContentInput): Promise<Diagram> => {
    await delay();
    const existing = findOrThrow(id);
    existing.nodes = content.nodes;
    existing.edges = content.edges;
    existing.visibility = content.visibility;
    existing.localRules = content.localRules;
    existing.updatedAt = new Date().toISOString();
    return existing;
  },

  remove: async (id: string): Promise<void> => {
    await delay();
    tables.diagrams = tables.diagrams.filter((d) => d.id !== id);
  },
};
