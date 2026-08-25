'use client'

import { useQuery } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'
import { computePlayerDelmatchRecord, type DelmatchRow, type PlayerDelmatchRecord } from '@bowlkollen/core'

type RawCell = {
  bits_match_id: number; match_date: string | null; serie: number; table_no: number
  is_home_team: boolean; player_order: number; public_id: string | null; player_name: string; score: number
}

// A player's whole delmatch (bord) career — duel record, rivalries, partnerships,
// milestones. Parity with native: the get_player_delmatch RPC returns the raw cell
// rows (keyed by public_id, never lic_nbr), the tested core engine aggregates.
// RPC isn't in the generated types yet → client cast to untyped (per AGENTS.md).
export function usePlayerDelmatchRecord(publicId: string) {
  return useQuery({
    queryKey: ['player-delmatch', publicId],
    staleTime: STALE.LONG,
    retry: false,
    queryFn: async (): Promise<PlayerDelmatchRecord> => {
      const db = createClient() as unknown as SupabaseClient
      const { data, error } = await db.rpc('get_player_delmatch', { p_public_id: publicId })
      if (error) return computePlayerDelmatchRecord([], publicId)
      const rows: DelmatchRow[] = ((data ?? []) as RawCell[]).map(r => ({
        matchId: r.bits_match_id, date: r.match_date, serie: r.serie, tableNo: r.table_no,
        order: r.player_order, isHomeTeam: r.is_home_team, publicId: r.public_id,
        playerName: r.player_name, score: r.score,
      }))
      return computePlayerDelmatchRecord(rows, publicId)
    },
  })
}
