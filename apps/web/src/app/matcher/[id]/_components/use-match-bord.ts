'use client'

import { useQuery } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'
import { computeDelmatcher, type DelmatchSlot, type DelmatchSummary } from '@bowlkollen/core'

// Bordsvy (2v2 delmatch) + "hetaste bordet" (rivalry) for the web match page —
// parity with native (apps/mobile match page). bits_match_delmatch + the
// get_match_rivalry RPC aren't in the generated types yet, so the client is cast
// to an untyped SupabaseClient (same convention as apps/mobile, per AGENTS.md).

type DelmatchDbRow = {
  serie: number; table_no: number; player_order: number
  is_home_team: boolean; player_name: string; lic_nbr: string | null; score: number
}

/** Reconstruct the match's bord head-to-heads, with licences resolved to
 * public_ids so bord names can open player profiles. */
export function useMatchDelmatch(matchId: number) {
  return useQuery({
    queryKey: ['match-delmatch', matchId],
    staleTime: STALE.LONG,
    queryFn: async (): Promise<DelmatchSummary> => {
      const db = createClient() as unknown as SupabaseClient
      const { data } = await db.from('bits_match_delmatch')
        .select('serie, table_no, player_order, is_home_team, player_name, lic_nbr, score')
        .eq('bits_match_id', matchId)
      const rows = (data ?? []) as DelmatchDbRow[]
      if (!rows.length) return computeDelmatcher([])

      const lics = [...new Set(rows.map(r => r.lic_nbr).filter(Boolean) as string[])]
      const links: Record<string, { publicId: string; name: string }> = {}
      if (lics.length) {
        const { data: players } = await db.from('bits_players').select('lic_nbr, public_id, first_name, sur_name').in('lic_nbr', lics)
        for (const p of (players ?? []) as { lic_nbr: string; public_id: string; first_name: string; sur_name: string }[]) {
          links[p.lic_nbr] = { publicId: p.public_id, name: `${p.first_name} ${p.sur_name}`.trim() }
        }
      }
      const slots: DelmatchSlot[] = rows.map(r => {
        const link = r.lic_nbr ? links[r.lic_nbr] : undefined
        return {
          serie: r.serie, tableNo: r.table_no, order: r.player_order,
          isHomeTeam: r.is_home_team,
          playerName: link?.name || r.player_name, // full name where resolved, else BITS short form
          publicId: link?.publicId ?? null, score: r.score,
        }
      })
      return computeDelmatcher(slots)
    },
  })
}

export type MatchRivalry = {
  a: { publicId: string | null; name: string; wins: number }
  b: { publicId: string | null; name: string; wins: number }
  ties: number
  meetings: number
  tonight: 'a' | 'b' | 'split'
}

type RivalryRow = {
  a_public_id: string | null; a_name: string; a_wins: number; a_tonight_wins: number
  b_public_id: string | null; b_name: string; b_wins: number; b_tonight_wins: number
  ties: number; meetings: number
}

/** The finished match's marquee career head-to-head. null when no genuine rivalry. */
export function useMatchRivalry(matchId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['match-rivalry', matchId],
    enabled,
    staleTime: STALE.LONG,
    queryFn: async (): Promise<MatchRivalry | null> => {
      const db = createClient() as unknown as SupabaseClient
      const { data } = await db.rpc('get_match_rivalry', { p_match_id: matchId })
      const row = ((data ?? []) as RivalryRow[])[0]
      if (!row) return null
      return {
        a: { publicId: row.a_public_id, name: row.a_name, wins: row.a_wins },
        b: { publicId: row.b_public_id, name: row.b_name, wins: row.b_wins },
        ties: row.ties,
        meetings: row.meetings,
        tonight: row.a_tonight_wins > row.b_tonight_wins ? 'a' : row.b_tonight_wins > row.a_tonight_wins ? 'b' : 'split',
      }
    },
  })
}
