'use client'

import { useQuery } from '@tanstack/react-query'

export type LiveScores = {
  series: { teamA: number[]; teamB: number[] }
  players: { name: string; games: number[]; total: number; isHomeTeam: boolean }[]
  updatedAt: string
}

// Polls the live-scores route while a match is in progress. 45s is well under a
// serie's play time, so the board stays current without hammering BITS (the route
// also caches ~25s across viewers).
export function useLiveMatch(matchId: number, enabled: boolean) {
  return useQuery<LiveScores>({
    queryKey: ['live-match', matchId],
    enabled,
    refetchInterval: enabled ? 45_000 : false,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const r = await fetch(`/api/live/${matchId}`, { cache: 'no-store' })
      if (!r.ok) throw new Error('live fetch failed')
      return r.json() as Promise<LiveScores>
    },
  })
}
