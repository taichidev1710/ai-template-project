import type { MemberListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const membersKeys = {
  all: ['members'] as const,
  lists: () => [...membersKeys.all, 'list'] as const,
  list: (params: MemberListParams) => [...membersKeys.lists(), params] as const,
};
