import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'
import { createPublicSupabase } from '@/lib/supabase-server'
import { keys, mapPlayerIdentityRow, mapPlayerMatchRows } from '@/lib/queries'
import PlayerProfileClient from './_components/PlayerProfileClient'

// Cookie-free — enables ISR via revalidate.
export const revalidate = 300   // revalidate player data every 5 minutes

// `id` is a bits_players.public_id — never the internal lic_nbr (see
// supabase/migrations/bits_player_public_id.sql). Both RPCs join through
// lic_nbr server-side and never return it.
export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const qc      = makeQueryClient()
  const supabase = createPublicSupabase()

  await Promise.all([
    qc.prefetchQuery({
      queryKey: keys.playerIdentity(id),
      queryFn: async () => {
        const { data } = await supabase.rpc('get_player_identity', { p_public_id: id }).maybeSingle()
        return mapPlayerIdentityRow(data)
      },
    }),
    qc.prefetchQuery({
      queryKey: keys.playerBitsResults(id),
      queryFn: async () => {
        const { data } = await supabase.rpc('get_player_match_history', { p_public_id: id })
        return mapPlayerMatchRows(data)
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PlayerProfileClient id={id} />
    </HydrationBoundary>
  )
}
