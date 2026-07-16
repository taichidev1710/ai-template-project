import type { Paginated } from '@/shared/api';
import { delay, genId, getTypeOrThrow, paginate } from '@/shared/diagram-db/db';
import type { Relation, RelationInput, RelationsListParams } from '../types';

/**
 * Feature API layer — relations are scoped to their owning Loại sơ đồ, so a
 * derived relation's `overRelationId` and a rule's relation always point at a
 * relation that exists in the same bundle.
 */
export const relationTypesApi = {
  list: async (typeId: string, params: RelationsListParams): Promise<Paginated<Relation>> => {
    await delay();
    return paginate(getTypeOrThrow(typeId).relations, params, (r) => [r.name, r.id, r.kind]);
  },

  /** All relations of a type (unpaginated) — used to populate the derived-over select. */
  listAll: async (typeId: string): Promise<Relation[]> => {
    await delay(0);
    return getTypeOrThrow(typeId).relations;
  },

  get: async (typeId: string, id: string): Promise<Relation> => {
    await delay();
    const found = getTypeOrThrow(typeId).relations.find((r) => r.id === id);
    if (!found) throw new Error('Relation not found');
    return found;
  },

  create: async (typeId: string, input: RelationInput): Promise<Relation> => {
    await delay();
    const type = getTypeOrThrow(typeId);
    const prefix = input.kind === 'derived' ? 'der' : 'rel';
    const created = { ...input, id: genId(prefix) } as Relation;
    type.relations = [created, ...type.relations];
    return created;
  },

  update: async (typeId: string, id: string, input: RelationInput): Promise<Relation> => {
    await delay();
    const type = getTypeOrThrow(typeId);
    const updated = { ...input, id } as Relation;
    type.relations = type.relations.map((r) => (r.id === id ? updated : r));
    return updated;
  },

  remove: async (typeId: string, id: string): Promise<void> => {
    await delay();
    const type = getTypeOrThrow(typeId);
    type.relations = type.relations.filter((r) => r.id !== id);
  },
};
