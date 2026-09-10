'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'

// A player's current BITS national ranking (rankingpoäng), via the public_id RPC
// (joins through lic_nbr server-side). null when the player isn't ranked or the
// migration/backfill isn't in place yet — safe to render either way.
export type PlayerRanking = {
  place_male:   number | null
  place_female: number | null
  rank_points:  number | null
  average:      number | null
  total_rounds: number | null
  skill_level:  number | null
  gender:       string | null
  season_id:    number | null
}

export function usePlayerRanking(playerId: string) {
  return useQuery<PlayerRanking | null>({
    queryKey: ['player-ranking', playerId],
    staleTime: STALE.LONG,
    retry: false,
    queryFn: async () => {
      // Cast: get_player_ranking isn't in the generated Database types yet.
      const db = createClient() as unknown as SupabaseClient
      const { data, error } = await db.rpc('get_player_ranking', { p_public_id: playerId })
      if (error) return null
      const row = Array.isArray(data) ? data[0] : data
      return (row as PlayerRanking) ?? null
    },
  })
}
