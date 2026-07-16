import type { Paginated } from '@/shared/api';
import { delay, genId, paginate, tables } from '@/shared/diagram-db/db';
import type { DiagramTemplate, DiagramTypeInput, DiagramTypesListParams } from '../types';

/** Feature API layer — CRUD over the Loại sơ đồ (template) bundles. */
export const diagramTypesApi = {
  list: async (params: DiagramTypesListParams): Promise<Paginated<DiagramTemplate>> => {
    await delay();
    return paginate(tables.templates, params, (t) => [t.name, t.description ?? '', t.id]);
  },

  /** Every type, unpaginated — for pickers that must offer the full vocabulary. */
  listAll: async (): Promise<DiagramTemplate[]> => {
    await delay();
    return tables.templates;
  },

  get: async (id: string): Promise<DiagramTemplate> => {
    await delay();
    const found = tables.templates.find((t) => t.id === id);
    if (!found) throw new Error('Diagram type not found');
    return found;
  },

  create: async (input: DiagramTypeInput): Promise<DiagramTemplate> => {
    await delay();
    const created: DiagramTemplate = {
      id: genId('tpl'),
      name: input.name,
      icon: input.icon,
      description: input.description,
      blockTypes: [],
      relations: [],
      ruleSets: [],
    };
    tables.templates = [created, ...tables.templates];
    return created;
  },

  update: async (id: string, input: DiagramTypeInput): Promise<DiagramTemplate> => {
    await delay();
    const existing = tables.templates.find((t) => t.id === id);
    if (!existing) throw new Error('Diagram type not found');
    Object.assign(existing, input); // keep the catalog arrays, patch header fields
    return existing;
  },

  remove: async (id: string): Promise<void> => {
    await delay();
    tables.templates = tables.templates.filter((t) => t.id !== id);
  },
};
