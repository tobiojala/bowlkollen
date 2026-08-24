import { notFound } from 'next/navigation'
import { createPublicSupabase } from '@/lib/supabase-server'
import { CompetitionClient, type CompRow, type CompResult } from './_components/CompetitionClient'

export const revalidate = 300

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const competitionId = parseInt(id, 10)
  if (isNaN(competitionId)) notFound()

  const supabase = createPublicSupabase()
  const { data: comp } = await supabase
    .from('bits_competitions').select('*')
    .eq('bits_competition_id', competitionId).maybeSingle()
  if (!comp) notFound()

  const { data: rawResults } = await supabase
    .from('bits_competition_results').select('*')
    .eq('bits_competition_id', competitionId)
    .order('result_row_nbr', { ascending: true })
    .order('place', { ascending: true })

  const results = (rawResults ?? []) as CompResult[]

  // Resolve licences → public_id so player names can link to their profiles.
  const licNbrs = [...new Set(results.map(r => r.lic_nbr).filter(Boolean) as string[])]
  const playerLinks: Record<string, string> = {}
  if (licNbrs.length) {
    const { data: players } = await supabase
      .from('bits_players').select('lic_nbr, public_id').in('lic_nbr', licNbrs)
    for (const p of (players ?? []) as { lic_nbr: string; public_id: string }[]) {
      playerLinks[p.lic_nbr] = p.public_id
    }
  }

  return <CompetitionClient comp={comp as CompRow} results={results} playerLinks={playerLinks} />
}
