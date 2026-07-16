import type { Paginated } from '@/shared/api';
import { delay, genId, paginate, tables } from '@/shared/diagram-db/db';
import type { BlockType, BlockTypeInput, BlockTypesListParams } from '../types';

/**
 * Feature API layer — the ONLY place that knows where block types live. Backed
 * by the shared in-memory library (swap for apiClient when a backend exists).
 */
export const blockTypesApi = {
  list: async (params: BlockTypesListParams): Promise<Paginated<BlockType>> => {
    await delay();
    return paginate(tables.blockTypes, params, (b) => [b.name, b.id]);
  },

  get: async (id: string): Promise<BlockType> => {
    await delay();
    const found = tables.blockTypes.find((b) => b.id === id);
    if (!found) throw new Error('Block type not found');
    return found;
  },

  create: async (input: BlockTypeInput): Promise<BlockType> => {
    await delay();
    const created: BlockType = { ...input, id: genId('bt') };
    tables.blockTypes = [created, ...tables.blockTypes];
    return created;
  },

  update: async (id: string, input: BlockTypeInput): Promise<BlockType> => {
    await delay();
    const updated: BlockType = { ...input, id };
    tables.blockTypes = tables.blockTypes.map((b) => (b.id === id ? updated : b));
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    await delay();
    tables.blockTypes = tables.blockTypes.filter((b) => b.id !== id);
  },
};
