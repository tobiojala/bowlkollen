'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useSession } from '@/lib/queries'
import { STALE } from '@/lib/constants'

/** The signed-in user's verified player public_id ('' if unclaimed) — used to weave
 *  their league matches into the logbook. */
export function useMyPublicId() {
  const { data: session } = useSession()
  const uid = session?.user?.id
  return useQuery({
    queryKey: ['my-public-id', uid],
    enabled: !!uid,
    staleTime: STALE.MEDIUM,
    queryFn: async (): Promise<string> => {
      const { data } = await createClient()
        .from('player_claims').select('player_id').eq('user_id', uid!).eq('status', 'verified').maybeSingle()
      return (data as { player_id: string } | null)?.player_id ?? ''
    },
  })
}
