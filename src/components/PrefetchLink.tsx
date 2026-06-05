'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRef, useCallback } from 'react'
import { prefetchMatch, prefetchPlayer, prefetchTeam } from '@/lib/prefetch'

type PrefetchType = 'match' | 'player' | 'team'

type Props = {
  href: string
  prefetch: PrefetchType
  entityId: string
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

// Drop-in <a> replacement that prefetches data on hover/touchstart.
// The prefetch fires once per entity — React Query deduplicates concurrent
// calls and skips if the cache is still fresh (within staleTime).
export default function PrefetchLink({ href, prefetch, entityId, children, style, className }: Props) {
  const qc      = useQueryClient()
  const pending = useRef(false)

  const fire = useCallback(() => {
    if (pending.current) return
    pending.current = true
    const fn = prefetch === 'match'  ? prefetchMatch
             : prefetch === 'player' ? prefetchPlayer
             :                         prefetchTeam
    fn(qc, entityId).finally(() => { pending.current = false })
  }, [qc, prefetch, entityId])

  return (
    <a
      href={href}
      style={style}
      className={className}
      onMouseEnter={fire}
      onTouchStart={fire}
    >
      {children}
    </a>
  )
}
