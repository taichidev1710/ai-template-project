import type { TierListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const tiersKeys = {
  all: ['tiers'] as const,
  lists: () => [...tiersKeys.all, 'list'] as const,
  list: (params: TierListParams) => [...tiersKeys.lists(), params] as const,
};
