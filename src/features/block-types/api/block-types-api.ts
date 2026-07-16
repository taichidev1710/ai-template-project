import type { Paginated } from '@/shared/api';
import { delay, genId, getTypeOrThrow, paginate } from '@/shared/diagram-db/db';
import type { BlockType, BlockTypeInput, BlockTypesListParams } from '../types';

/**
 * Feature API layer — block types are always scoped to their owning Loại sơ đồ
 * (`typeId`), so a rule in that type only ever picks block types that exist in
 * the same bundle. Backed by the shared in-memory library.
 */
export const blockTypesApi = {
  list: async (typeId: string, params: BlockTypesListParams): Promise<Paginated<BlockType>> => {
    await delay();
    return paginate(getTypeOrThrow(typeId).blockTypes, params, (b) => [b.name, b.id]);
  },

  get: async (typeId: string, id: string): Promise<BlockType> => {
    await delay();
    const found = getTypeOrThrow(typeId).blockTypes.find((b) => b.id === id);
    if (!found) throw new Error('Block type not found');
    return found;
  },

  create: async (typeId: string, input: BlockTypeInput): Promise<BlockType> => {
    await delay();
    const type = getTypeOrThrow(typeId);
    const created: BlockType = { ...input, id: genId('bt') };
    type.blockTypes = [created, ...type.blockTypes];
    return created;
  },

  update: async (typeId: string, id: string, input: BlockTypeInput): Promise<BlockType> => {
    await delay();
    const type = getTypeOrThrow(typeId);
    const updated: BlockType = { ...input, id };
    type.blockTypes = type.blockTypes.map((b) => (b.id === id ? updated : b));
    return updated;
  },

  remove: async (typeId: string, id: string): Promise<void> => {
    await delay();
    const type = getTypeOrThrow(typeId);
    type.blockTypes = type.blockTypes.filter((b) => b.id !== id);
  },
};
