'use client'

import { Heart } from 'lucide-react'
import { useSession, useIsFollowing, useToggleFollow } from '@/lib/queries'
import type { FollowEntityType } from '@/lib/types'
import { COLOR } from '@/lib/brand'

interface Props {
  entityType: FollowEntityType
  entityId: string
  /** 'icon' = circle icon only · 'pill' = icon + label text */
  variant?: 'icon' | 'pill'
  size?: 'sm' | 'md'
}

export default function FollowButton({ entityType, entityId, variant = 'icon', size = 'md' }: Props) {
  const { data: session }              = useSession()
  const isFollowing                    = useIsFollowing(entityType, entityId)
  const { mutate, isPending, error }   = useToggleFollow(entityType, entityId)

  if (!session) return null

  const dim      = size === 'sm' ? 32 : 40
  const iconSize = size === 'sm' ? 15 : 18

  // Server-enforced junior guardrail rejected the attempt (see
  // enforce_junior_follow_guard) — most surfaces don't proactively hide
  // the button for unclaimed junior players, so this is the fallback.
  const blockedMessage = error instanceof Error && error.message === 'JUNIOR_UNCLAIMED'
    ? 'Minderårig — ej verifierad än'
    : null

  if (variant === 'pill') {
    return (
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        onClick={() => mutate()}
        disabled={isPending}
        aria-label={isFollowing ? 'Sluta följa' : 'Följ'}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: size === 'sm' ? '6px 12px' : '8px 16px',
          background: isFollowing ? 'rgba(245,194,0,0.12)' : COLOR.surface2,
          border: `1px solid ${isFollowing ? 'rgba(245,194,0,0.35)' : COLOR.hairline}`,
          borderRadius: 9999,
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.6 : 1,
          transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Heart
          size={size === 'sm' ? 13 : 15}
          strokeWidth={2}
          color={isFollowing ? COLOR.gold : COLOR.ink3}
          fill={isFollowing ? COLOR.gold : 'none'}
        />
        <span style={{
          fontSize: size === 'sm' ? 12 : 13, fontWeight: 600,
          color: isFollowing ? COLOR.gold : COLOR.ink3,
        }}>
          {isFollowing ? 'Följer' : 'Följ'}
        </span>
      </button>
      {blockedMessage && (
        <span style={{ fontSize: 10, color: COLOR.ink3, maxWidth: 140, textAlign: 'right' }}>{blockedMessage}</span>
      )}
      </span>
    )
  }

  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        onClick={() => mutate()}
        disabled={isPending}
        aria-label={isFollowing ? 'Sluta följa' : 'Följ'}
        style={{
          width: dim, height: dim, borderRadius: dim / 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isFollowing ? 'rgba(245,194,0,0.15)' : COLOR.surface2,
          border: `1px solid ${isFollowing ? 'rgba(245,194,0,0.35)' : COLOR.hairline}`,
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.6 : 1,
          transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
          WebkitTapHighlightColor: 'transparent',
          flexShrink: 0,
        }}
      >
        <Heart
          size={iconSize}
          strokeWidth={2}
          color={isFollowing ? COLOR.gold : COLOR.ink4}
          fill={isFollowing ? COLOR.gold : 'none'}
        />
      </button>
      {blockedMessage && (
        <span style={{ fontSize: 9, color: COLOR.ink3, maxWidth: 90, textAlign: 'right' }}>{blockedMessage}</span>
      )}
    </span>
  )
}
