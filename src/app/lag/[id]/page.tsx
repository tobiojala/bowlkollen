import { notFound } from 'next/navigation'
import { createPublicSupabase } from '@/lib/supabase-server'
import { computeStandings } from '@/lib/division-standings'
import { SEASON } from '@/lib/constants'
import { toMatchRow, type DbMatchRow } from '@/lib/bits-matches'
import { LagClient } from './_components/LagClient'

// A BITS team's page — their season (fixtures + results) in the division they
// play, their table position, and their identity. Current BITS data, works for
// every team (unlike the legacy /teams/[uuid] pages that cover only ~10%).
export const revalidate = 300

export default async function LagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const teamId = parseInt(id, 10)
  if (isNaN(teamId)) notFound()

  const supabase   = createPublicSupabase()
  const seasonYear = Number(SEASON.CURRENT.slice(0, 4))

  const { data: rawTeamMatches } = await supabase
    .from('bits_matches')
    .select('*')
    .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
    .eq('season_id', seasonYear)
    .order('match_date', { ascending: true })

  const teamMatches = (rawTeamMatches ?? []).map(m => toMatchRow(m as unknown as DbMatchRow))
  if (teamMatches.length === 0) notFound()

  const first = (rawTeamMatches ?? [])[0] as DbMatchRow
  const divisionId = first.bits_division_id
  if (divisionId == null) notFound()
  const teamName =
    teamMatches.find(m => m.home_bits_team_id === teamId)?.home_team_name ??
    teamMatches.find(m => m.away_bits_team_id === teamId)?.away_team_name ??
    'Lag'

  const [{ data: teamRow }, { data: division }, { data: divMatchesRaw }, { data: rosterRows }] = await Promise.all([
    supabase.from('bits_teams').select('bits_club_id').eq('bits_team_id', teamId).maybeSingle(),
    supabase.from('bits_divisions').select('name').eq('bits_division_id', divisionId).eq('season_id', seasonYear).maybeSingle(),
    supabase.from('bits_matches').select('*').eq('bits_division_id', divisionId).eq('season_id', seasonYear),
    supabase.rpc('get_team_roster', { p_bits_team_id: teamId, p_limit: 30 }),
  ])

  const standings = computeStandings((divMatchesRaw ?? []).map(m => toMatchRow(m as unknown as DbMatchRow)))
  const rankIdx   = standings.findIndex(s => s.teamId === teamId)
  const standing  = rankIdx >= 0
    ? { rank: rankIdx + 1, total: standings.length, points: standings[rankIdx].points, played: standings[rankIdx].played }
    : null

  type RosterRow = { public_id: string; name: string; licence_average: number | null; appearances: number }
  const roster = (rosterRows ?? []) as RosterRow[]

  return (
    <LagClient
      teamId={teamId}
      teamName={teamName}
      clubId={(teamRow?.bits_club_id as number | null) ?? null}
      divisionId={divisionId}
      divisionName={division?.name ?? null}
      matches={teamMatches}
      standing={standing}
      roster={roster}
    />
  )
}
