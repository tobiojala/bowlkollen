'use client'

import { useQuery } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'

const untyped = () => createClient() as unknown as SupabaseClient

export type BestSplit = { name: string; avg: number; games: number } | null

// Ranked, context-aware lineup candidates (the "suggestion tool"): who to pick,
// with the average that actually matters for THIS match + a plays-down flag.
export type LineupCandidate = {
  publicId: string; name: string
  overallAvg: number | null; overallGames: number
  venueAvg: number | null; venueGames: number
  divisionAvg: number | null; divisionGames: number
  homeTeam: string | null; homeDivision: string | null
  availability: string | null
}

// Swedish division tiers, lower = higher level (the hierarchy).
export function divisionRank(name: string | null | undefined): number {
  const n = (name ?? '').toLowerCase()
  if (n.includes('elit')) return 1
  if (n.includes('allsven')) return 2
  if (/division\s*1|div\s*1\b/.test(n)) return 3
  if (/division\s*2|div\s*2\b/.test(n)) return 4
  if (/division\s*3|div\s*3\b/.test(n)) return 5
  if (/division\s*4|div\s*4\b/.test(n)) return 6
  return 99
}

// Advisory (§ D 306): does this player normally play a HIGHER division than the
// match's? A soft "check the spärr rules" flag.
export function playsDown(homeDivision: string | null, matchDivision: string | null): boolean {
  if (!homeDivision || !matchDivision) return false
  return divisionRank(homeDivision) < divisionRank(matchDivision)
}

const MIN_CONTEXT_GAMES = 3

// The number to show/rank on: venue if bowled enough, else this division, else overall.
export function candidateFit(c: LineupCandidate): { value: number | null; context: 'venue' | 'division' | 'overall' } {
  if (c.venueAvg != null && c.venueGames >= MIN_CONTEXT_GAMES) return { value: c.venueAvg, context: 'venue' }
  if (c.divisionAvg != null && c.divisionGames >= MIN_CONTEXT_GAMES) return { value: c.divisionAvg, context: 'division' }
  return { value: c.overallAvg, context: 'overall' }
}

export const FIT_LABEL: Record<'venue' | 'division' | 'overall', string> = {
  venue: 'hemmabana', division: 'i divisionen', overall: 'totalt',
}

export function useLineupCandidates(teamId: number, matchId: number) {
  return useQuery({
    queryKey: ['lineup-candidates', teamId, matchId],
    enabled: teamId > 0 && matchId > 0,
    queryFn: async (): Promise<LineupCandidate[]> => {
      const { data, error } = await untyped().rpc('get_lineup_candidates', { p_bits_team_id: teamId, p_bits_match_id: matchId })
      if (error) throw error
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        publicId: r.public_id as string,
        name: (r.player_name as string | null) ?? 'Spelare',
        overallAvg: (r.overall_avg as number | null) ?? null,
        overallGames: (r.overall_games as number | null) ?? 0,
        venueAvg: (r.venue_avg as number | null) ?? null,
        venueGames: (r.venue_games as number | null) ?? 0,
        divisionAvg: (r.division_avg as number | null) ?? null,
        divisionGames: (r.division_games as number | null) ?? 0,
        homeTeam: (r.home_team as string | null) ?? null,
        homeDivision: (r.home_division as string | null) ?? null,
        availability: (r.availability as string | null) ?? null,
      }))
    },
  })
}

// Historical partnership records among a set of players — the captain's "bästa
// konstellationer" suggestions. Caller sorts/filters for a sensible sample.
export type Konstellation = { aPublicId: string; bPublicId: string; wins: number; losses: number; ties: number; together: number; winRate: number }

export function useKonstellationer(publicIds: string[]) {
  const ids = [...publicIds].sort()
  return useQuery({
    queryKey: ['konstellationer', ids.join(',')],
    enabled: ids.length >= 2,
    staleTime: STALE.LONG,
    queryFn: async (): Promise<Konstellation[]> => {
      const { data, error } = await untyped().rpc('get_konstellationer', { p_public_ids: ids })
      if (error) throw error
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        aPublicId: r.a_public_id as string, bPublicId: r.b_public_id as string,
        wins: r.wins as number, losses: r.losses as number, ties: r.ties as number, together: r.together as number,
        winRate: (r.wins as number) / (((r.wins as number) + (r.losses as number)) || 1),
      }))
    },
  })
}
