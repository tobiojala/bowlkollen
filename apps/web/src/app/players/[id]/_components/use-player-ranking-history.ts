'use client'

import { useQuery } from '@tanstack/react-query'
import { STALE } from '@/lib/constants'

// One point of the profile's 12-month ranking curve (spelstyrka/ranking/snitt).
export type RankingGraphPoint = { xLabel: string; spelstyrka: number; ranking: number; snitt: number }

// The player's monthly ranking history from BITS, via the server route (which
// resolves the licence number server-side). [] when unavailable — safe to render.
export function usePlayerRankingHistory(playerId: string) {
  return useQuery<RankingGraphPoint[]>({
    queryKey: ['player-ranking-history', playerId],
    staleTime: STALE.LONG,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/ranking-history`)
      if (!res.ok) return []
      return (await res.json()) as RankingGraphPoint[]
    },
  })
}
