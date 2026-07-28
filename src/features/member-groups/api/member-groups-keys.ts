import type { MemberGroupListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const memberGroupsKeys = {
  all: ['member-groups'] as const,
  lists: () => [...memberGroupsKeys.all, 'list'] as const,
  list: (params: MemberGroupListParams) => [...memberGroupsKeys.lists(), params] as const,
};
