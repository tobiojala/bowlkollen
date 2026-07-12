import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'
import { createPublicSupabase } from '@/lib/supabase-public'
import { keys } from '@/lib/queries'
import { SEASON } from '@/lib/constants'
import { SchemaIndex } from './_components/SchemaIndex'

// Schema is the reference library (search + browse every division). The old
// personalized pulse-feed moved to Home; the Atlas/Karta map is parked.
// Cookie-free prefetch → the division list is ISR-cached and hydrates with no
// loading flash.
export const revalidate = 3600

export default async function SchemaPage() {
  const qc = makeQueryClient()
  const supabase = createPublicSupabase()

  await qc.prefetchQuery({
    queryKey: keys.allDivisions,
    queryFn: async () => {
      const { data } = await supabase
        .from('bits_divisions')
        .select('bits_division_id, name')
        .eq('season_id', Number(SEASON.CURRENT.slice(0, 4)))
        .order('name')
      return data ?? []
    },
  })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <SchemaIndex />
    </HydrationBoundary>
  )
}
