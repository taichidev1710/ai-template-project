import type { ProviderListParams } from '../types';

/** Query key factory cho registry nhà cung cấp. */
export const providersKeys = {
  all: ['providers'] as const,
  lists: () => [...providersKeys.all, 'list'] as const,
  list: (params: ProviderListParams) => [...providersKeys.lists(), params] as const,
};
