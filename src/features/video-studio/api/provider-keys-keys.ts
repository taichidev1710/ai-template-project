/** Query key factory cho provider keys — cache nhất quán + invalidate chính xác. */
export const providerKeysKeys = {
  all: ['provider-keys'] as const,
  list: () => [...providerKeysKeys.all, 'list'] as const,
};
