'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'

// Public follower count for an entity via get_follow_count — aggregate-only, so no
// row data leaks (the follows table itself is RLS-private). Covers FOLLOWERS only;
// "following" stays private under RLS and isn't shown for other players.
export function useFollowerCount(entityType: 'player' | 'team', entityId: string) {
  return useQuery({
    queryKey: ['follow-count', entityType, entityId],
    enabled: !!entityId,
    staleTime: STALE.MEDIUM,
    queryFn: async () => {
      const { data } = await createClient().rpc('get_follow_count', { p_entity_type: entityType, p_entity_id: entityId })
      return typeof data === 'number' ? data : Number(data ?? 0)
    },
  })
}
