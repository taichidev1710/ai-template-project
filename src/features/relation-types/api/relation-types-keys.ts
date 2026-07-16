import type { RelationsListParams } from '../types';

/** Query key factory — scoped by the owning Loại sơ đồ (`typeId`). */
export const relationTypesKeys = {
  all: (typeId: string) => ['relation-types', typeId] as const,
  lists: (typeId: string) => [...relationTypesKeys.all(typeId), 'list'] as const,
  list: (typeId: string, params: RelationsListParams) => [...relationTypesKeys.lists(typeId), params] as const,
  allItems: (typeId: string) => [...relationTypesKeys.all(typeId), 'all'] as const,
};
