'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { Follow, FollowEntityType } from '@/lib/types'

const FOLLOWS_KEY = ['follows'] as const

// Follow / unfollow, with optimistic updates so the button AND the follower count
// flip instantly (then reconcile). Kept out of queries.ts to keep that file small;
// re-exported from '@/lib/queries' so call sites don't change.
export function useToggleFollow(entityType: FollowEntityType, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('not_authenticated')
      const uid = session.user.id
      const { data: existing } = await supabase
        .from('follows').select('id')
        .eq('user_id', uid).eq('entity_type', entityType).eq('entity_id', entityId).maybeSingle()
      if (existing) {
        await supabase.from('follows').delete().eq('id', existing.id)
        return false
      }
      const { error } = await supabase.from('follows').insert({ user_id: uid, entity_type: entityType, entity_id: entityId })
      // Server-enforced junior guardrail (enforce_junior_follow_guard) → recognizable error for the UI.
      if (error) throw new Error(error.message.includes('junior_unclaimed') ? 'JUNIOR_UNCLAIMED' : error.message)
      return true
    },
    // Optimistic: flip the follows list and the follower count immediately.
    onMutate: async () => {
      const countKey = ['follow-count', entityType, entityId]
      await qc.cancelQueries({ queryKey: FOLLOWS_KEY })
      await qc.cancelQueries({ queryKey: countKey })
      const prevFollows = qc.getQueryData<Follow[]>(FOLLOWS_KEY)
      const prevCount = qc.getQueryData<number>(countKey)
      const isNow = (prevFollows ?? []).some(f => f.entity_type === entityType && f.entity_id === entityId)
      qc.setQueryData<Follow[]>(FOLLOWS_KEY, (old = []) =>
        isNow
          ? old.filter(f => !(f.entity_type === entityType && f.entity_id === entityId))
          : [...old, { id: `optimistic-${entityId}`, user_id: '', entity_type: entityType, entity_id: entityId, created_at: new Date().toISOString() }])
      qc.setQueryData<number>(countKey, c => Math.max(0, (c ?? 0) + (isNow ? -1 : 1)))
      return { prevFollows, prevCount, countKey }
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return
      qc.setQueryData(FOLLOWS_KEY, ctx.prevFollows)
      qc.setQueryData(ctx.countKey, ctx.prevCount)
    },
    onSettled: (_d, _e, _v, ctx) => {
      qc.invalidateQueries({ queryKey: FOLLOWS_KEY })
      if (ctx) qc.invalidateQueries({ queryKey: ctx.countKey })
    },
  })
}
