import type { FeatureListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const featuresKeys = {
  all: ['features'] as const,
  lists: () => [...featuresKeys.all, 'list'] as const,
  list: (params: FeatureListParams) => [...featuresKeys.lists(), params] as const,
};
