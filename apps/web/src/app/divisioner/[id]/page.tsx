import { notFound } from 'next/navigation'
import { createPublicSupabase } from '@/lib/supabase-server'
import { computeStandings } from '@/lib/division-standings'
import { SEASON } from '@/lib/constants'
import { toMatchRow, type DbMatchRow } from '@/lib/bits-matches'
import { DivisionClient } from './_components/DivisionClient'

export const revalidate = 300

export default async function DivisionPage(
  { params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ team?: string; season?: string }> },
) {
  const { id } = await params
  const sp = await searchParams
  const teamFilter = sp?.team ? Number(sp.team) : null
  const divisionId = parseInt(id, 10)
  if (isNaN(divisionId)) notFound()

  const supabase = createPublicSupabase()
  const currentYear = Number(SEASON.CURRENT.slice(0, 4))

  // Division IDs are stable across seasons (bits_matches.season_id distinguishes
  // them) — so BOTH the name and the seasons picker come from bits_divisions, which
  // holds exactly one row per (division, season). Deriving seasons from bits_matches
  // instead hits PostgREST's 1000-row cap once a division has ~19 seasons of games
  // (post-2008 backfill), silently dropping the NEWEST seasons. The selected season
  // comes from ?season= (default: current, else newest).
  const { data: divRows } = await supabase
    .from('bits_divisions').select('name, season_id')
    .eq('bits_division_id', divisionId).order('season_id', { ascending: false })
  const division = divRows?.[0] ?? null
  if (!division) notFound()

  const seasons = (divRows ?? []).map(r => r.season_id)
  const wanted = sp?.season ? Number(sp.season) : null
  const seasonYear = wanted && seasons.includes(wanted) ? wanted
    : seasons.includes(currentYear) ? currentYear
    : seasons[0] ?? currentYear

  const { data: rawMatches } = await supabase
    .from('bits_matches').select('*')
    .eq('bits_division_id', divisionId).eq('season_id', seasonYear)
    .order('match_date', { ascending: true })

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
      seasons={seasons}
      matches={matches}
      standings={standings}
      teamFilterName={teamFilterName}
      teamFilterId={filtered ? teamFilter : null}
    />
  )
}
