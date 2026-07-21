'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useSession } from '@/lib/queries'
import { getAnonId } from '@/lib/anon-id'
import type { FollowEntityType } from '@/lib/types'

/**
 * Records that an anonymous (logged-out) visitor viewed a player/team page,
 * so the onboarding screen can offer "you looked at X — follow them?" at
 * signup. No-ops once signed in, and when `skip` is true (used to exclude
 * junior player pages from tracking entirely).
 *
 * Kept out of queries.ts deliberately — that module is also imported by
 * Server Components (for prefetch mappers), and useEffect/useRef would force
 * it into a client-only module.
 */
export function useTrackAnonView(entityType: FollowEntityType, entityId: string | null, skip = false) {
  const { data: session } = useSession()
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current || skip || session || !entityId) return
    fired.current = true
    // .insert() is a lazy thenable — it doesn't fire until awaited/`.then()`'d.
    createClient().from('anon_views').insert({ anon_id: getAnonId(), entity_type: entityType, entity_id: entityId }).then()
  }, [entityType, entityId, skip, session])
}
