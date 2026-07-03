'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'
import { buildPlayerNameFilter, escapeLike, divisionMatches } from '@/lib/discover'
import { useAllDivisions } from '@/lib/queries'

export const SEARCH_MIN = 2

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlayerHit = {
  id: string
  name: string
  teamName: string | null
  lastTotal: number | null
  lastDate: string
  lastVenue: string | null
}
export type TeamHit     = { bitsTeamId: number; bitsClubId: number; name: string; clubName: string | null; logoUrl: string | null }
export type DivisionHit = { id: number; name: string }
export type SeriesHit   = { id: string; name: string; clubName: string | null; total: number; date: string; venue: string | null }
export type FollowedHit = { id: string; name: string; clubName: string | null; followers: number }

type RawRecentPlayer = {
  public_id: string; name: string; club_name: string | null
  last_total: number | null; last_date: string | null; hall_name: string | null
}
type RawSeries   = { public_id: string; name: string; club_name: string | null; total: number; match_date: string; hall_name: string | null }
type RawFollowed = { public_id: string; name: string; club_name: string | null; follower_count: number }

// ── Shelves ───────────────────────────────────────────────────────────────────

export function useRecentPlayers() {
  return useQuery({
    queryKey: ['discover', 'recent'],
    queryFn: async (): Promise<PlayerHit[]> => {
      const { data, error } = await createClient().rpc('get_discover_recent_players', { p_limit: 40 })
      if (error) throw error
      return (data as RawRecentPlayer[] ?? []).map(p => ({
        id: p.public_id, name: p.name, teamName: p.club_name,
        lastTotal: p.last_total, lastDate: p.last_date ?? '', lastVenue: p.hall_name,
      }))
    },
    staleTime: STALE.DEFAULT,
  })
}

/** Best series the last 7 days. Fails soft (empty shelf) until the
 * discover_shelves.sql migration is applied. */
export function useTopSeries() {
  return useQuery({
    queryKey: ['discover', 'top-series'],
    queryFn: async (): Promise<SeriesHit[]> => {
      const { data, error } = await createClient().rpc('get_discover_top_series', { p_days: 7, p_limit: 5 })
      if (error) return []
      return (data as RawSeries[] ?? []).map(s => ({
        id: s.public_id, name: s.name, clubName: s.club_name,
        total: s.total, date: s.match_date, venue: s.hall_name,
      }))
    },
    staleTime: STALE.MEDIUM,
  })
}

/** Players ranked by follower count. Fails soft like useTopSeries. */
export function useMostFollowed() {
  return useQuery({
    queryKey: ['discover', 'most-followed'],
    queryFn: async (): Promise<FollowedHit[]> => {
      const { data, error } = await createClient().rpc('get_discover_most_followed', { p_limit: 6 })
      if (error) return []
      return (data as RawFollowed[] ?? []).map(f => ({
        id: f.public_id, name: f.name, clubName: f.club_name, followers: f.follower_count,
      }))
    },
    staleTime: STALE.MEDIUM,
  })
}

// ── Search ────────────────────────────────────────────────────────────────────

export function useSearch(q: string) {
  const { data: allDivisions = [] } = useAllDivisions()

  // Divisions filter synchronously against the cached list — outside the
  // search query, so an early search can't freeze an empty division list
  // into the cache while useAllDivisions is still loading.
  const divisions: DivisionHit[] = useMemo(() =>
    allDivisions
      .filter(d => divisionMatches(d.name, q))
      .slice(0, 5)
      .map(d => ({ id: d.bits_division_id, name: d.name })),
    [allDivisions, q])

  const query = useQuery({
    queryKey: ['discover', 'search', q],
    queryFn: async (): Promise<{ players: PlayerHit[]; teams: TeamHit[] }> => {
      const supabase = createClient()
      const term = `%${escapeLike(q.trim())}%`
      const [pr, tr] = await Promise.all([
        supabase.from('bits_players').select('public_id,first_name,sur_name,club_name')
          .or(buildPlayerNameFilter(q)).limit(8),
        supabase.from('bits_teams').select('bits_team_id,bits_club_id,name,club_name')
          .or(`name.ilike.${term},club_name.ilike.${term}`).limit(6),
      ])

      const players: PlayerHit[] = (pr.data ?? []).map(p => ({
        id: p.public_id, name: `${p.first_name} ${p.sur_name}`.trim(),
        teamName: p.club_name, lastTotal: null, lastDate: '', lastVenue: null,
      }))

      // Club logos for team hits — one extra lookup, cheap and cacheable
      const rawTeams = (tr.data ?? []).filter(
        (t): t is typeof t & { bits_club_id: number } => t.bits_club_id !== null,
      )
      const clubIds = [...new Set(rawTeams.map(t => t.bits_club_id))]
      const logos = new Map<number, string | null>()
      if (clubIds.length > 0) {
        const { data: clubs } = await supabase.from('bits_clubs')
          .select('bits_id, logo_url').in('bits_id', clubIds)
        for (const c of clubs ?? []) logos.set(c.bits_id, c.logo_url)
      }
      const teams: TeamHit[] = rawTeams.map(t => ({
        bitsTeamId: t.bits_team_id, bitsClubId: t.bits_club_id,
        name: t.name, clubName: t.club_name,
        logoUrl: logos.get(t.bits_club_id) ?? null,
      }))

      return { players, teams }
    },
    enabled: q.trim().length >= SEARCH_MIN,
    staleTime: STALE.DEFAULT,
  })

  return { ...query, divisions }
}
