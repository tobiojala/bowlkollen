import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'
import { createPublicSupabase } from '@/lib/supabase-public'
import { keys } from '@/lib/queries'
import { QUERY } from '@/lib/constants'
import { syncTeamEvents } from '@/lib/sync-team-events'
import TeamClient from './_components/TeamClient'

// Cookie-free — enables ISR via revalidate.
export const revalidate = 300   // revalidate team data every 5 minutes

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const qc      = makeQueryClient()
  const supabase = createPublicSupabase()

  // Sync runs first so prefetched events include any newly generated ones.
  // Errors are swallowed — the feed falls back to client-side fetch.
  await syncTeamEvents(id).catch(() => {})

  await Promise.all([
    qc.prefetchQuery({
      queryKey: keys.team(id),
      queryFn: async () => {
        const { data } = await supabase.from('teams').select('*').eq('id', id).single()
        return data
      },
    }),
    qc.prefetchQuery({
      queryKey: keys.teamMatches(id),
      queryFn: async () => {
        const { data } = await supabase
          .from('matches')
          .select('id,date,status,division,home_score,away_score,home_team_id,away_team_id,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
          .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
          .order('date', { ascending: false })
          .limit(QUERY.TEAM_MATCHES_LIMIT)
        return data ?? []
      },
    }),
    qc.prefetchQuery({
      queryKey: keys.teamEvents(id),
      queryFn: async () => {
        const { data } = await supabase
          .from('team_events')
          .select('*')
          .eq('team_id', id)
          .eq('is_hidden', false)
          .order('event_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(30)
        return data ?? []
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <TeamClient id={id} />
    </HydrationBoundary>
  )
}
