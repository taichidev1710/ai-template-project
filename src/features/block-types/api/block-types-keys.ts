import type { BlockTypesListParams } from '../types';

/** Query key factory — scoped by the owning Loại sơ đồ (`typeId`). */
export const blockTypesKeys = {
  all: (typeId: string) => ['block-types', typeId] as const,
  lists: (typeId: string) => [...blockTypesKeys.all(typeId), 'list'] as const,
  list: (typeId: string, params: BlockTypesListParams) => [...blockTypesKeys.lists(typeId), params] as const,
  details: (typeId: string) => [...blockTypesKeys.all(typeId), 'detail'] as const,
  detail: (typeId: string, id: string) => [...blockTypesKeys.details(typeId), id] as const,
};
