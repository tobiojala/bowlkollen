import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'
import { createServerSupabase } from '@/lib/supabase-server'
import { keys } from '@/lib/queries'
import MatchClient from './_components/MatchClient'


export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const qc      = makeQueryClient()
  const supabase = await createServerSupabase()

  await Promise.all([
    qc.prefetchQuery({
      queryKey: keys.match(id),
      queryFn: async () => {
        const { data } = await supabase
          .from('matches')
          .select('*,home:teams!home_team_id(id,name,club),away:teams!away_team_id(id,name,club)')
          .eq('id', id).single()
        return data
      },
    }),
    qc.prefetchQuery({
      queryKey: keys.matchLineup(id),
      queryFn: async () => {
        const { data } = await supabase
          .from('match_lineups').select('*').eq('match_id', id).order('bord').order('position')
        return data ?? []
      },
    }),
    qc.prefetchQuery({
      queryKey: keys.matchResults(id),
      queryFn: async () => {
        const { data } = await supabase
          .from('match_results').select('*,player:players!player_id(id,name,team_id)').eq('match_id', id)
        return data ?? []
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <MatchClient id={id} />
    </HydrationBoundary>
  )
}
