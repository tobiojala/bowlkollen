'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'
import { computeStandings } from '@/lib/division-standings'
import { toMatchRow, type DbMatchRow } from '@/lib/bits-matches'

// Resolve a match's hall name → bowling_centers.id so the venue can link to its
// page. bits_matches carries only hall_name (no id), so we match by name.
export function useCenterId(hallName: string | null) {
  return useQuery({
    queryKey: ['center-id', hallName],
    enabled: !!hallName,
    staleTime: STALE.LONG,
    queryFn: async (): Promise<number | null> => {
      const { data } = await createClient().from('bowling_centers').select('id').ilike('name', hallName!).limit(1).maybeSingle()
      return (data as { id: number } | null)?.id ?? null
    },
  })
}

export type MatchContext = {
  homeRank: number | null
  awayRank: number | null
  totalTeams: number
  h2h: { homeWins: number; awayWins: number; meetings: number } | null
}

// Season context for a match: each team's current standing in its division, and
// the two teams' head-to-head record. Free — it's the context that gives a match
// meaning within the season, and links back into the division.
export function useMatchContext(divisionId: number | null, seasonId: number, homeTeamId: number | null, awayTeamId: number | null) {
  return useQuery<MatchContext>({
    queryKey: ['match-context', divisionId, seasonId, homeTeamId, awayTeamId],
    enabled: !!homeTeamId && !!awayTeamId,
    staleTime: STALE.MEDIUM,
    queryFn: async () => {
      const db = createClient()
      let homeRank: number | null = null, awayRank: number | null = null, totalTeams = 0

      if (divisionId) {
        const { data } = await db.from('bits_matches').select('*').eq('bits_division_id', divisionId).eq('season_id', seasonId)
        const standings = computeStandings(((data ?? []) as unknown as DbMatchRow[]).map(toMatchRow))
        totalTeams = standings.length
        const hi = standings.findIndex(s => s.teamId === homeTeamId); if (hi >= 0) homeRank = hi + 1
        const ai = standings.findIndex(s => s.teamId === awayTeamId); if (ai >= 0) awayRank = ai + 1
      }

      const { data: rows } = await db.from('bits_matches')
        .select('home_bits_team_id, away_bits_team_id, home_result, away_result, is_finished')
        .in('home_bits_team_id', [homeTeamId!, awayTeamId!])
        .in('away_bits_team_id', [homeTeamId!, awayTeamId!])
        .eq('is_finished', true)
      let homeWins = 0, awayWins = 0, meetings = 0
      for (const r of (rows ?? []) as { home_bits_team_id: number; away_bits_team_id: number; home_result: number | null; away_result: number | null }[]) {
        if (r.home_result == null || r.away_result == null) continue
        meetings++
        if (r.home_result === r.away_result) continue
        const winner = r.home_result > r.away_result ? r.home_bits_team_id : r.away_bits_team_id
        if (winner === homeTeamId) homeWins++; else if (winner === awayTeamId) awayWins++
      }
      return { homeRank, awayRank, totalTeams, h2h: meetings ? { homeWins, awayWins, meetings } : null }
    },
  })
}
