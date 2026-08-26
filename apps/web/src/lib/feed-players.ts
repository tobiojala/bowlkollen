'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'
import type { FeedPlayerResult } from '@/lib/types'

// Recent BITS results for the players you follow: public_id → lic_nbr → result
// rows → matches. Replaces the legacy usePersonalizedFeed player branch, which
// read the dead pre-BITS `match_results` tables (keyed by ids that no longer
// exist) and returned nothing. Powers both the player story circles and the
// player cards in the feed.
export function useFollowedPlayerResults(publicIds: string[]) {
  const ids = [...publicIds].sort()
  return useQuery<FeedPlayerResult[]>({
    queryKey: ['feed', 'followed-players', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: STALE.SHORT,
    queryFn: async () => {
      const db = createClient()

      // public_id → lic_nbr
      const { data: players } = await db
        .from('bits_players').select('public_id,lic_nbr').in('public_id', ids)
      const licToPub = new Map<string, string>()
      for (const p of (players ?? []) as { public_id: string; lic_nbr: string }[]) licToPub.set(p.lic_nbr, p.public_id)
      const lics = [...licToPub.keys()]
      if (lics.length === 0) return []

      // their result rows
      const { data: results } = await db
        .from('bits_match_player_results')
        .select('bits_match_id,lic_nbr,player_name,is_home_team,series,total_result')
        .in('lic_nbr', lics)
        .limit(200)
      if (!results?.length) return []

      // matches (dates / division / opponent), finished only
      const matchIds = [...new Set((results as { bits_match_id: number }[]).map(r => r.bits_match_id))]
      const { data: matches } = await db
        .from('bits_matches')
        .select('bits_match_id,division_name,home_team_name,away_team_name,match_date,is_finished')
        .in('bits_match_id', matchIds).eq('is_finished', true)
      const mMap = new Map((matches ?? []).map(m => [(m as { bits_match_id: number }).bits_match_id, m]))

      const items: FeedPlayerResult[] = []
      for (const r of results as unknown as Array<{
        bits_match_id: number; lic_nbr: string; player_name: string
        is_home_team: boolean; series: number[]; total_result: number
      }>) {
        const m = mMap.get(r.bits_match_id) as { division_name: string | null; home_team_name: string; away_team_name: string; match_date: string } | undefined
        const pub = licToPub.get(r.lic_nbr)
        if (!m || !pub || !(r.total_result > 0 && r.total_result <= 1200)) continue
        items.push({
          kind: 'player_result', playerId: pub, playerName: r.player_name,
          matchId: String(r.bits_match_id), date: m.match_date, total: r.total_result,
          games: r.series ?? [], division: m.division_name ?? '',
          opponent: r.is_home_team ? m.away_team_name : m.home_team_name,
        })
      }
      return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40)
    },
  })
}
