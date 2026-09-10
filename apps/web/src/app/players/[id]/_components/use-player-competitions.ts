'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'

// A player's BITS competition history (rank_points = real BITS rankingpoäng),
// shared by the profile's competition list and the Säsongskurva's Rank. tab so
// they read the same source. Returns [] on any error so it's safe to render
// before the migration/backfill exists.
export type CompHistoryRow = {
  bits_competition_id: number
  competition_name: string
  start_date: string | null
  place: number | null
  total_pins: number
  total_games: number
  rank_points: number | null
}

export function usePlayerCompetitions(playerId: string) {
  return useQuery<CompHistoryRow[]>({
    queryKey: ['player-competitions', playerId],
    staleTime: STALE.MEDIUM,
    retry: false,
    queryFn: async () => {
      const db = createClient()
      const { data, error } = await db.rpc('get_player_competition_results', { p_public_id: playerId })
      if (error) return []
      return (data ?? []) as CompHistoryRow[]
    },
  })
}
