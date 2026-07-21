import { QueryClient } from '@tanstack/react-query';

// Matches the web app's stale-time philosophy (see apps/web src/lib/constants.ts).
// Kept local for now; folds into @bowlkollen/core when the shared query layer lands.
export const STALE = {
  LIVE: 20_000, // 20s — live match scores
  SHORT: 30_000, // 30s — home feed
  DEFAULT: 60_000, // 60s — most lists
  MEDIUM: 300_000, // 5m — standings, session
  LONG: 600_000, // 10m — slow-moving data
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.DEFAULT,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
