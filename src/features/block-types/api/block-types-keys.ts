import type { BlockTypesListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const blockTypesKeys = {
  all: ['block-types'] as const,
  lists: () => [...blockTypesKeys.all, 'list'] as const,
  list: (params: BlockTypesListParams) => [...blockTypesKeys.lists(), params] as const,
  details: () => [...blockTypesKeys.all, 'detail'] as const,
  detail: (id: string) => [...blockTypesKeys.details(), id] as const,
};
