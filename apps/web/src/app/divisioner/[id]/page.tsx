import { notFound } from 'next/navigation'
import { createPublicSupabase } from '@/lib/supabase-server'
import { computeStandings } from '@/lib/division-standings'
import { SEASON } from '@/lib/constants'
import { toMatchRow, type DbMatchRow } from '@/lib/bits-matches'
import { DivisionClient } from './_components/DivisionClient'

export const revalidate = 300

export default async function DivisionPage(
  { params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ team?: string }> },
) {
  const { id } = await params
  const sp = await searchParams
  const teamFilter = sp?.team ? Number(sp.team) : null
  const divisionId = parseInt(id, 10)
  if (isNaN(divisionId)) notFound()

  const supabase = createPublicSupabase()
  const seasonYear = Number(SEASON.CURRENT.slice(0, 4))

  const [{ data: division }, { data: rawMatches }] = await Promise.all([
    supabase
      .from('bits_divisions')
      .select('bits_division_id, name')
      .eq('bits_division_id', divisionId)
      .eq('season_id', seasonYear)
      .single(),
    supabase
      .from('bits_matches')
      .select('*')
      .eq('bits_division_id', divisionId)
      .eq('season_id', seasonYear)
      .order('match_date', { ascending: true }),
  ])

  if (!division) notFound()

  const allMatches = (rawMatches ?? []).map(m => toMatchRow(m as unknown as DbMatchRow))
  // Standings always reflect the whole division, even in a team lens.
  const standings = computeStandings(allMatches)

  // Team lens — tapping a team inside the division filters to that team's games
  // (keeps you in this division; the club page would scatter you across squads).
  const filtered = teamFilter != null && !isNaN(teamFilter)
  const matches = filtered
    ? allMatches.filter(m => m.home_bits_team_id === teamFilter || m.away_bits_team_id === teamFilter)
    : allMatches
  const teamFilterName = filtered
    ? (allMatches.find(m => m.home_bits_team_id === teamFilter)?.home_team_name
       ?? allMatches.find(m => m.away_bits_team_id === teamFilter)?.away_team_name
       ?? null)
    : null

  return (
    <DivisionClient
      divisionId={divisionId}
      divisionName={division.name}
      seasonYear={seasonYear}
      matches={matches}
      standings={standings}
      teamFilterName={teamFilterName}
      teamFilterId={filtered ? teamFilter : null}
    />
  )
}
