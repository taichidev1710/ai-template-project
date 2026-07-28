import type { MemberFeatureListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const memberFeaturesKeys = {
  all: ['member-features'] as const,
  lists: () => [...memberFeaturesKeys.all, 'list'] as const,
  list: (params: MemberFeatureListParams) => [...memberFeaturesKeys.lists(), params] as const,
};
