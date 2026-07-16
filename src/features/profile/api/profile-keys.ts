import type { ProfileListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const profileKeys = {
  all: ['profile'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (params: ProfileListParams) => [...profileKeys.lists(), params] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
};
