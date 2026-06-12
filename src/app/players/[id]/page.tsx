import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'
import { createPublicSupabase } from '@/lib/supabase-public'
import { keys } from '@/lib/queries'
import PlayerClient from './_components/PlayerClient'

// Cookie-free — enables ISR via revalidate.
export const revalidate = 300   // revalidate player data every 5 minutes

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const qc      = makeQueryClient()
  const supabase = createPublicSupabase()

  await Promise.all([
    qc.prefetchQuery({
      queryKey: keys.player(id),
      queryFn: async () => {
        const { data } = await supabase.from('players').select('*').eq('id', id).single()
        return data
      },
    }),
    qc.prefetchQuery({
      queryKey: keys.playerResults(id),
      queryFn: async () => {
        const { data } = await supabase
          .from('match_results')
          .select('id,player_id,match_id,games,matches:match_id(id,date,division,home_team_id,away_team_id,home_score,away_score,home:teams!home_team_id(name),away:teams!away_team_id(name))')
          .eq('player_id', id)
          .order('created_at', { ascending: false })
        return data ?? []
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PlayerClient id={id} />
    </HydrationBoundary>
  )
}
