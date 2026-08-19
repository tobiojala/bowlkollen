import { useQuery } from '@tanstack/react-query'
import { computeTeamStats, type TeamStatMatch, type TeamStatResult, type TeamStats } from '@bowlkollen/core'
import { createClient } from '@/lib/supabase'
import { SEASON, STALE } from '@/lib/constants'

// Deep team stats from BITS, via the shared core engine. Current season first;
// if it has no finished matches yet (off-season / early), fall back to last
// season so the page is never empty — same pattern as the team page's table.
const LAST_SEASON_FLOOR = '2025-07-01'

const MATCH_COLS =
  'bits_match_id, match_date, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, home_result, away_result, is_finished'

async function fetchWindow(teamId: number, floor: string, ceilExclusive: string | null) {
  const db = createClient()
  let q = db.from('bits_matches').select(MATCH_COLS)
    .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
    .gte('match_date', floor)
    .order('match_date', { ascending: true })
  if (ceilExclusive) q = q.lt('match_date', ceilExclusive)
  const { data: matches } = await q
  const ms = (matches ?? []) as TeamStatMatch[]
  const finished = ms.filter((m) => m.is_finished)
  if (!finished.length) return null

  const { data: results } = await db.from('bits_match_player_results')
    .select('bits_match_id, player_name, lic_nbr, series, is_home_team')
    .in('bits_match_id', finished.map((m) => m.bits_match_id))
  return computeTeamStats(teamId, ms, (results ?? []) as TeamStatResult[])
}

export function useBitsTeamName(teamId: number) {
  return useQuery<string | null>({
    queryKey: ['bits-team-name', teamId],
    enabled: teamId > 0,
    staleTime: STALE.LONG,
    queryFn: async () => {
      const { data } = await createClient().from('bits_teams').select('name').eq('bits_team_id', teamId).maybeSingle()
      return (data as { name: string } | null)?.name ?? null
    },
  })
}

export type TeamStatsResult = { stats: TeamStats; season: 'current' | 'last' } | null

export function useTeamStats(teamId: number) {
  return useQuery<TeamStatsResult>({
    queryKey: ['team-stats', teamId],
    enabled: teamId > 0,
    staleTime: STALE.MEDIUM,
    queryFn: async () => {
      const current = await fetchWindow(teamId, SEASON.CURRENT, null)
      if (current) return { stats: current, season: 'current' }
      const last = await fetchWindow(teamId, LAST_SEASON_FLOOR, SEASON.CURRENT)
      if (last) return { stats: last, season: 'last' }
      return null
    },
  })
}
