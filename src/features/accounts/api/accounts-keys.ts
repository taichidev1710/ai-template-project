import type { PendingListParams } from '../types';

/** Query key factory — keeps cache keys consistent and invalidation precise. */
export const accountsKeys = {
  all: ['accounts'] as const,
  pending: (params: PendingListParams) => [...accountsKeys.all, 'pending', params] as const,
  history: (id: string) => [...accountsKeys.all, 'history', id] as const,
};
