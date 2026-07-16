import { QueryClient } from '@tanstack/react-query';

/** App-wide QueryClient. Tune defaults here, not per-hook. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min — data considered fresh, no refetch
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
