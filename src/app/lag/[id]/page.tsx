import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { createPublicSupabase } from '@/lib/supabase-server'
import { computeStandings, type TeamStanding } from '@/lib/division-standings'
import { SEASON } from '@/lib/constants'
import { toMatchRow, type DbMatchRow } from '@/lib/bits-matches'
import { LagClient } from './_components/LagClient'

type SeasonSummary = {
  seasonLabel:  string
  divisionId:   number
  divisionName: string | null
  standing:     { rank: number; total: number; points: number; played: number }
  standings:    TeamStanding[]
}

/** Last season's final table position — the fallback for the first weeks of a
 * new season, before this team has a single finished match yet. bits_team_id
 * is stable year to year (unlike bits_division_id, which is season-scoped),
 * so we find last season's division through this team's own matches. */
async function loadPrevSeasonSummary(
  supabase: ReturnType<typeof createPublicSupabase>, teamId: number, prevYear: number,
): Promise<SeasonSummary | null> {
  const { data: rawPrevMatches } = await supabase
    .from('bits_matches')
    .select('*')
    .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
    .eq('season_id', prevYear)

  const prevDivisionId = (rawPrevMatches ?? [])[0]?.bits_division_id as number | undefined
  if (prevDivisionId == null) return null

  const [{ data: prevDivMatchesRaw }, { data: prevDivision }] = await Promise.all([
    supabase.from('bits_matches').select('*').eq('bits_division_id', prevDivisionId).eq('season_id', prevYear),
    supabase.from('bits_divisions').select('name').eq('bits_division_id', prevDivisionId).eq('season_id', prevYear).maybeSingle(),
  ])

  const standings = computeStandings((prevDivMatchesRaw ?? []).map(m => toMatchRow(m as unknown as DbMatchRow)))
  const rankIdx    = standings.findIndex(s => s.teamId === teamId)
  if (rankIdx === -1) return null

  return {
    seasonLabel:  `${prevYear}/${String(prevYear + 1).slice(2)}`,
    divisionId:   prevDivisionId,
    divisionName: prevDivision?.name ?? null,
    standing:     { rank: rankIdx + 1, total: standings.length, points: standings[rankIdx].points, played: standings[rankIdx].played },
    standings,
  }
}

// A BITS team's page — their season (fixtures + results) in the division they
// play, their table position, and their identity. Current BITS data, works for
// every team (unlike the legacy /teams/[uuid] pages that cover only ~10%).
// Doubles as the team's public, shareable front door for fans and sponsors —
// generateMetadata below gives it a real link preview when shared.
export const revalidate = 300

const loadTeam = cache(async (id: string) => {
  const teamId = parseInt(id, 10)
  if (isNaN(teamId)) return null

  const supabase   = createPublicSupabase()
  const seasonYear = Number(SEASON.CURRENT.slice(0, 4))

  const { data: rawTeamMatches } = await supabase
    .from('bits_matches')
    .select('*')
    .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
    .eq('season_id', seasonYear)
    .order('match_date', { ascending: true })

  const teamMatches = (rawTeamMatches ?? []).map(m => toMatchRow(m as unknown as DbMatchRow))
  if (teamMatches.length === 0) return null

  const first = (rawTeamMatches ?? [])[0] as DbMatchRow
  const divisionId = first.bits_division_id
  if (divisionId == null) return null
  const teamName =
    teamMatches.find(m => m.home_bits_team_id === teamId)?.home_team_name ??
    teamMatches.find(m => m.away_bits_team_id === teamId)?.away_team_name ??
    'Lag'

  const [{ data: teamRow }, { data: division }, { data: divMatchesRaw }, { data: rosterRows }] = await Promise.all([
    supabase.from('bits_teams').select('bits_club_id, club_name, hall_id, hall_name').eq('bits_team_id', teamId).maybeSingle(),
    supabase.from('bits_divisions').select('name').eq('bits_division_id', divisionId).eq('season_id', seasonYear).maybeSingle(),
    supabase.from('bits_matches').select('*').eq('bits_division_id', divisionId).eq('season_id', seasonYear),
    supabase.rpc('get_team_roster', { p_bits_team_id: teamId, p_limit: 30 }),
  ])

  const standings = computeStandings((divMatchesRaw ?? []).map(m => toMatchRow(m as unknown as DbMatchRow)))
  const rankIdx   = standings.findIndex(s => s.teamId === teamId)
  const standing  = rankIdx >= 0
    ? { rank: rankIdx + 1, total: standings.length, points: standings[rankIdx].points, played: standings[rankIdx].played }
    : null

  // Early season — no finished matches yet this year. Fall back to last
  // season's final table so the page has something to show before the new
  // season builds up its own story.
  const prevSeason = standing === null
    ? await loadPrevSeasonSummary(supabase, teamId, seasonYear - 1)
    : null

  type RosterRow = { public_id: string; name: string; licence_average: number | null; appearances: number }
  const roster = (rosterRows ?? []) as RosterRow[]

  return {
    teamId,
    teamName,
    clubId:       (teamRow?.bits_club_id as number | null) ?? null,
    clubName:     (teamRow?.club_name as string | null) ?? null,
    hallId:       (teamRow?.hall_id as number | null) ?? null,
    hallName:     (teamRow?.hall_name as string | null) ?? null,
    divisionId,
    divisionName: division?.name ?? null,
    matches:      teamMatches,
    standing,
    standings,
    prevSeason,
    roster,
  }
})

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const team = await loadTeam(id)
  if (!team) return {}

  const description = team.standing
    ? `Plats ${team.standing.rank} av ${team.standing.total} · ${team.standing.points} poäng — ${team.divisionName ?? ''}`
    : team.prevSeason
    ? `Förra säsongen: plats ${team.prevSeason.standing.rank} av ${team.prevSeason.standing.total} — ${team.divisionName ?? ''}`
    : team.divisionName ?? undefined

  return {
    title: team.teamName,
    description,
    openGraph: { title: team.teamName, description },
  }
}

export default async function LagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const team = await loadTeam(id)
  if (!team) notFound()

  return <LagClient {...team} />
}
