'use client'

import { useSession, useIsFollowing, useToggleFollow } from '@/lib/queries'
import type { FollowEntityType } from '@/lib/types'
import { COLOR } from '@/lib/brand'

interface Props {
  entityType: FollowEntityType
  entityId: string
  /** Kept for call-site compatibility; both render the same Följ/Följer pill. */
  variant?: 'icon' | 'pill'
  size?: 'sm' | 'md'
}

// A "Följ" / "Följer" text pill — matches the native follow button. No heart:
// a heart reads as "like", follow is a distinct relationship. Outlined when not
// following, gold-filled ("Följer") once you do.
export default function FollowButton({ entityType, entityId, size = 'md' }: Props) {
  const { data: session }            = useSession()
  const isFollowing                  = useIsFollowing(entityType, entityId)
  const { mutate, isPending, error } = useToggleFollow(entityType, entityId)

  if (!session) return null

  // Server-enforced junior guardrail rejected the attempt (see enforce_junior_follow_guard).
  const blockedMessage = error instanceof Error && error.message === 'JUNIOR_UNCLAIMED'
    ? 'Minderårig — ej verifierad än'
    : null

  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        onClick={() => mutate()}
        disabled={isPending}
        aria-label={isFollowing ? 'Sluta följa' : 'Följ'}
        style={{
          padding: size === 'sm' ? '5px 13px' : '8px 18px',
          borderRadius: 9999,
          fontSize: size === 'sm' ? 13 : 14,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          background: isFollowing ? COLOR.gold : 'transparent',
          border: `1px solid ${isFollowing ? COLOR.gold : COLOR.ink4}`,
          color: isFollowing ? COLOR.bg : COLOR.ink,
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.6 : 1,
          transition: 'background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s',
          WebkitTapHighlightColor: 'transparent',
          flexShrink: 0,
        }}
      >
        {isFollowing ? 'Följer' : 'Följ'}
      </button>
      {blockedMessage && (
        <span style={{ fontSize: 10, color: COLOR.ink3, maxWidth: 140, textAlign: 'right' }}>{blockedMessage}</span>
      )}
    </span>
  )
}
