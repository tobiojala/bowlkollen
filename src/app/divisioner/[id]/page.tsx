import { notFound } from 'next/navigation'
import { createPublicSupabase } from '@/lib/supabase-server'
import { computeStandings } from '@/lib/division-standings'
import { SEASON } from '@/lib/constants'
import { DivisionClient } from './_components/DivisionClient'
import type { MatchRow } from '@/lib/division-standings'
import type { Database } from '@/lib/database.types'

export const revalidate = 300

type DbMatchRow = Database['public']['Tables']['bits_matches']['Row']

function toMatchRow(m: DbMatchRow): MatchRow {
  return {
    bits_match_id:     m.bits_match_id,
    home_bits_team_id: m.home_bits_team_id,
    away_bits_team_id: m.away_bits_team_id,
    home_team_name:    m.home_team_name,
    away_team_name:    m.away_team_name,
    home_result:       m.home_result,
    away_result:       m.away_result,
    is_finished:       m.is_finished,
    match_date:        m.match_date,
    round_id:          m.round_id,
  }
}

export default async function DivisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const matches = (rawMatches ?? []).map(m => toMatchRow(m as unknown as DbMatchRow))
  const standings = computeStandings(matches)

  return (
    <DivisionClient
      divisionId={divisionId}
      divisionName={division.name}
      seasonYear={seasonYear}
      matches={matches}
      standings={standings}
    />
  )
}
