import 'server-only'
import { computeTeamStats, type TeamStatMatch, type TeamStatResult, type TeamStats } from '@bowlkollen/core'
import { createPublicSupabase } from '@/lib/supabase-public'
import { SEASON } from '@/lib/constants'

// Server-side team stats (cookie-free public client) for the OG share card and any
// future Server Component. Mirrors the client hook's season fallback.
const LAST_SEASON_FLOOR = '2025-07-01'
const MATCH_COLS =
  'bits_match_id, match_date, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, home_result, away_result, is_finished'

async function fetchWindow(teamId: number, floor: string, ceil: string | null): Promise<TeamStats | null> {
  const db = createPublicSupabase()
  let q = db.from('bits_matches').select(MATCH_COLS)
    .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
    .gte('match_date', floor)
    .order('match_date', { ascending: true })
  if (ceil) q = q.lt('match_date', ceil)
  const { data: matches } = await q
  const ms = (matches ?? []) as TeamStatMatch[]
  const finished = ms.filter((m) => m.is_finished)
  if (!finished.length) return null
  const { data: results } = await db.from('bits_match_player_results')
    .select('bits_match_id, player_name, lic_nbr, series, is_home_team')
    .in('bits_match_id', finished.map((m) => m.bits_match_id))
  return computeTeamStats(teamId, ms, (results ?? []) as TeamStatResult[])
}

export async function getTeamStatsServer(teamId: number): Promise<{ name: string; stats: TeamStats } | null> {
  const db = createPublicSupabase()
  const { data: team } = await db.from('bits_teams').select('name').eq('bits_team_id', teamId).maybeSingle()
  const name = (team as { name: string } | null)?.name
  if (!name) return null
  const stats = (await fetchWindow(teamId, SEASON.CURRENT, null)) ?? (await fetchWindow(teamId, LAST_SEASON_FLOOR, SEASON.CURRENT))
  if (!stats) return null
  return { name, stats }
}
