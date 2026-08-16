'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useSession } from '@/lib/queries'

// player_notes / bits_matches user-scoped reads. player_notes isn't in the
// generated types (run supabase/migrations/player_notes.sql) — reach it untyped.
const untyped = () => createClient() as unknown as SupabaseClient

const SEASON_ID = 2026
const todayISO = () => new Date().toISOString().slice(0, 10)

export type NextMatch = {
  matchId: number; date: string; hall: string | null; division: string | null
  myTeamId: number; myTeamName: string; opponentName: string; isHome: boolean
}

/** Soonest upcoming fixture across the user's teams (verified claims), falling
 * back to followed teams so the card lights up before anyone claims a team. */
export function useNextMatch() {
  const { data: session } = useSession()
  const uid = session?.user?.id
  return useQuery({
    queryKey: ['next-match', uid],
    enabled: !!uid,
    queryFn: async (): Promise<NextMatch | null> => {
      const supabase = createClient()
      const { data: claims } = await supabase
        .from('team_claims').select('bits_team_id').eq('user_id', uid!).eq('status', 'verified')
      let teamIds = ((claims ?? []) as { bits_team_id: number }[]).map((c) => c.bits_team_id)
      if (teamIds.length === 0) {
        const { data: follows } = await supabase
          .from('follows').select('entity_id').eq('user_id', uid!).eq('entity_type', 'team')
        teamIds = ((follows ?? []) as { entity_id: string }[]).map((f) => Number(f.entity_id)).filter((n) => n > 0)
      }
      if (teamIds.length === 0) return null

      const ids = teamIds.join(',')
      const { data: rows } = await supabase
        .from('bits_matches')
        .select('bits_match_id, home_team_name, away_team_name, match_date, hall_name, division_name, home_bits_team_id, away_bits_team_id, is_finished')
        .or(`home_bits_team_id.in.(${ids}),away_bits_team_id.in.(${ids})`)
        .eq('season_id', SEASON_ID).eq('is_finished', false).gte('match_date', todayISO())
        .order('match_date', { ascending: true }).limit(1)

      const m = (rows ?? [])[0] as Record<string, unknown> | undefined
      if (!m) return null
      const isHome = teamIds.includes(m.home_bits_team_id as number)
      return {
        matchId: m.bits_match_id as number,
        date: m.match_date as string,
        hall: (m.hall_name as string | null) ?? null,
        division: (m.division_name as string | null) ?? null,
        myTeamId: (isHome ? m.home_bits_team_id : m.away_bits_team_id) as number,
        myTeamName: (isHome ? m.home_team_name : m.away_team_name) as string,
        opponentName: (isHome ? m.away_team_name : m.home_team_name) as string,
        isHome,
      }
    },
  })
}

export type PrepMatch = {
  matchId: number; date: string; hall: string | null; division: string | null
  homeName: string; awayName: string; homeTeamId: number | null; awayTeamId: number | null
}

export function usePrepMatch(matchId: number) {
  return useQuery({
    queryKey: ['prep-match', matchId],
    enabled: matchId > 0,
    queryFn: async (): Promise<PrepMatch | null> => {
      const { data } = await createClient()
        .from('bits_matches')
        .select('bits_match_id, match_date, hall_name, division_name, home_team_name, away_team_name, home_bits_team_id, away_bits_team_id')
        .eq('bits_match_id', matchId).maybeSingle()
      const m = data as Record<string, unknown> | null
      if (!m) return null
      return {
        matchId: m.bits_match_id as number, date: m.match_date as string,
        hall: (m.hall_name as string | null) ?? null, division: (m.division_name as string | null) ?? null,
        homeName: m.home_team_name as string, awayName: m.away_team_name as string,
        homeTeamId: (m.home_bits_team_id as number | null) ?? null, awayTeamId: (m.away_bits_team_id as number | null) ?? null,
      }
    },
  })
}

export type Note = { id: string; matchId: number | null; hall: string | null; body: string; createdAt: string }
const mapNote = (r: Record<string, unknown>): Note => ({
  id: r.id as string, matchId: (r.bits_match_id as number | null) ?? null,
  hall: (r.hall_name as string | null) ?? null, body: r.body as string, createdAt: r.created_at as string,
})

/** Every note at a given center, newest first — the "recall" when booked there again. */
export function useHallNotes(hall: string | null | undefined) {
  const { data: session } = useSession()
  const uid = session?.user?.id
  return useQuery({
    queryKey: ['hall-notes', uid, hall],
    enabled: !!uid && !!hall,
    queryFn: async (): Promise<Note[]> => {
      const { data } = await untyped()
        .from('player_notes').select('id, bits_match_id, hall_name, body, created_at')
        .eq('user_id', uid!).eq('hall_name', hall!).order('created_at', { ascending: false })
      return ((data ?? []) as Record<string, unknown>[]).map(mapNote)
    },
  })
}

export function useMatchNotes(matchId: number | null | undefined) {
  const { data: session } = useSession()
  const uid = session?.user?.id
  return useQuery({
    queryKey: ['match-notes', uid, matchId],
    enabled: !!uid && matchId != null,
    queryFn: async (): Promise<Note[]> => {
      const { data } = await untyped()
        .from('player_notes').select('id, bits_match_id, hall_name, body, created_at')
        .eq('user_id', uid!).eq('bits_match_id', matchId!).order('created_at', { ascending: false })
      return ((data ?? []) as Record<string, unknown>[]).map(mapNote)
    },
  })
}

export function useSaveNote() {
  const { data: session } = useSession()
  const uid = session?.user?.id
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { body: string; matchId: number | null; hall: string | null }) => {
      const { error } = await untyped().from('player_notes').insert({
        user_id: uid, bits_match_id: input.matchId, hall_name: input.hall, body: input.body.trim(),
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['match-notes', uid, v.matchId] })
      qc.invalidateQueries({ queryKey: ['hall-notes', uid, v.hall] })
    },
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await untyped().from('player_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match-notes'] })
      qc.invalidateQueries({ queryKey: ['hall-notes'] })
    },
  })
}

// ── Oil pattern (match_prep) + SvBF oil profiles ──────────────────────────────
export type OilProfile = { name: string; lengthFt: number | null; ratio: number | null; category: string | null; description: string | null }

/** Public SvBF oil profiles to pick from; [] before seeding (falls back to free entry). */
export function useOilProfiles() {
  return useQuery({
    queryKey: ['oil-profiles'],
    staleTime: 60 * 60_000,
    queryFn: async (): Promise<OilProfile[]> => {
      const { data } = await untyped()
        .from('oil_profiles').select('name, length_ft, ratio, category, description').order('length_ft', { ascending: true })
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        name: r.name as string, lengthFt: (r.length_ft as number | null) ?? null, ratio: (r.ratio as number | null) ?? null,
        category: (r.category as string | null) ?? null, description: (r.description as string | null) ?? null,
      }))
    },
  })
}

export function useMatchPattern(matchId: number | null | undefined) {
  const { data: session } = useSession()
  const uid = session?.user?.id
  return useQuery({
    queryKey: ['match-pattern', uid, matchId],
    enabled: !!uid && matchId != null,
    queryFn: async (): Promise<string | null> => {
      const { data } = await untyped()
        .from('match_prep').select('oil_pattern').eq('user_id', uid!).eq('bits_match_id', matchId!).maybeSingle()
      return ((data as Record<string, unknown> | null)?.oil_pattern as string | null) ?? null
    },
  })
}

export function useSetMatchPattern() {
  const { data: session } = useSession()
  const uid = session?.user?.id
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { matchId: number; pattern: string | null; hall: string | null }) => {
      const { error } = await untyped().from('match_prep').upsert(
        { user_id: uid, bits_match_id: v.matchId, oil_pattern: v.pattern, hall_name: v.hall, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,bits_match_id' },
      )
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['match-pattern', uid, v.matchId] })
      qc.invalidateQueries({ queryKey: ['pattern-history', uid] })
    },
  })
}

/** Notes I wrote on this same oil pattern at OTHER matches — cross-center recall. */
export function usePatternHistory(pattern: string | null | undefined, excludeMatchId: number) {
  const { data: session } = useSession()
  const uid = session?.user?.id
  return useQuery({
    queryKey: ['pattern-history', uid, pattern, excludeMatchId],
    enabled: !!uid && !!pattern,
    queryFn: async (): Promise<Note[]> => {
      const { data: preps } = await untyped()
        .from('match_prep').select('bits_match_id').eq('user_id', uid!).eq('oil_pattern', pattern!).neq('bits_match_id', excludeMatchId)
      const ids = ((preps ?? []) as Record<string, unknown>[]).map((p) => p.bits_match_id as number)
      if (ids.length === 0) return []
      const { data } = await untyped()
        .from('player_notes').select('id, bits_match_id, hall_name, body, created_at')
        .eq('user_id', uid!).in('bits_match_id', ids).order('created_at', { ascending: false }).limit(5)
      return ((data ?? []) as Record<string, unknown>[]).map(mapNote)
    },
  })
}
