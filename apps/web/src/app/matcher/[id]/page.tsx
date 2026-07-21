import { notFound } from 'next/navigation'
import { createPublicSupabase } from '@/lib/supabase-server'
import MatcherClient from './_components/MatcherClient'
import type { BitsMatchDetail, BitsMatchPlayerResult } from '@/lib/types'

export const revalidate = 60

export default async function MatcherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const matchId = Number(id)
  if (!Number.isFinite(matchId)) notFound()

  const db = createPublicSupabase()

  const [{ data: match }, { data: results }] = await Promise.all([
    db.from('bits_matches')
      .select('bits_match_id,match_date,division_name,bits_division_id,season_id,home_team_name,away_team_name,home_bits_team_id,away_bits_team_id,home_result,away_result,home_score,away_score,is_finished,hall_name,hall_city,oil_pattern,round_id,scores_synced')
      .eq('bits_match_id', matchId)
      .single(),
    db.from('bits_match_player_results')
      .select('id,bits_match_id,lic_nbr,player_name,is_home_team,series,total_result')
      .eq('bits_match_id', matchId)
      .order('total_result', { ascending: false }),
  ])

  if (!match) notFound()

  // Resolve each player's public profile id from their lic_nbr — no FK
  // embed exists between bits_match_player_results and bits_players, so this
  // is a second lookup (same pattern as useBitsTopScores in queries.ts).
  const licNbrs = [...new Set((results ?? []).map(r => r.lic_nbr))]
  const publicIdByLic = new Map<string, string>()
  if (licNbrs.length > 0) {
    const { data: players } = await db.from('bits_players').select('lic_nbr,public_id').in('lic_nbr', licNbrs)
    for (const p of players ?? []) publicIdByLic.set(p.lic_nbr, p.public_id)
  }
  const resultsWithPublicId = (results ?? []).map(r => ({ ...r, public_id: publicIdByLic.get(r.lic_nbr) ?? null }))

  return (
    <MatcherClient
      match={match as BitsMatchDetail}
      results={resultsWithPublicId as BitsMatchPlayerResult[]}
    />
  )
}
