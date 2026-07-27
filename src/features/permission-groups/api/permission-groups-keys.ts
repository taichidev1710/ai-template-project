import type { GroupListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const permissionGroupsKeys = {
  all: ['permission-groups'] as const,
  lists: () => [...permissionGroupsKeys.all, 'list'] as const,
  list: (params: GroupListParams) => [...permissionGroupsKeys.lists(), params] as const,
};
