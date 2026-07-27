import type { RolesListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (params: RolesListParams) => [...rolesKeys.lists(), params] as const,
};
