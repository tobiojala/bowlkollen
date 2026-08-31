import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'
import { createPublicSupabase } from '@/lib/supabase-public'
import { DiscoverClient } from './_components/DiscoverClient'

// Hitta (Discover) — player-first Explore. Cookie-free prefetch of the default
// mosaic's data (recent players + top halls) so the page hydrates with content
// instead of blank-then-pop. Recent players is a nightly matview, so hourly ISR
// is plenty fresh; the client search box stays fully client-side.
export const revalidate = 3600

export default async function DiscoverPage() {
  const qc = makeQueryClient()
  const supabase = createPublicSupabase()

  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['explore', 'recent-players'],
      queryFn: async () => {
        const { data } = await supabase.rpc('get_discover_recent_players', { p_limit: 60 })
        return data ?? []
      },
    }),
    qc.prefetchQuery({
      queryKey: ['explore', 'centers'],
      queryFn: async () => {
        const { data } = await supabase.from('bowling_centers').select('id, name, city, lanes').order('lanes', { ascending: false }).limit(8)
        return data ?? []
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <DiscoverClient />
    </HydrationBoundary>
  )
}
