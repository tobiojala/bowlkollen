'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, Heart, Share2, UserPlus, Bookmark, BookmarkCheck } from 'lucide-react'
import { useSession, useIsFollowing, useToggleFollow, useToggleReaction } from '@/lib/queries'
import { COLOR, SPACE, TYPE } from '@/lib/brand'
import type { ReactionType, TeamEventReaction, FollowEntityType } from '@/lib/types'

// ── Save helpers (localStorage) ───────────────────────────────────────────────

const SAVE_KEY = 'bk_feed_saved'

function getSaved(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SAVE_KEY) ?? '[]')) }
  catch { return new Set() }
}

function toggleSaved(id: string): boolean {
  const s = getSaved()
  if (s.has(id)) { s.delete(id) } else { s.add(id) }
  localStorage.setItem(SAVE_KEY, JSON.stringify([...s]))
  return s.has(id)
}

// ── Reactions ─────────────────────────────────────────────────────────────────

const REACTIONS: { type: ReactionType; Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number; fill?: string }> }[] = [
  { type: 'fire',  Icon: Flame },
  { type: 'heart', Icon: Heart },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  eventId?:    string
  reactions?:  TeamEventReaction[]
  followType?: FollowEntityType   // omit for entries without a single clear follow target
  followId?:   string
  saveKey?:    string
  shareTitle?: string
  shareUrl?:   string
}

export function FeedActions({
  eventId, reactions = [], followType, followId,
  saveKey, shareTitle, shareUrl,
}: Props) {
  const { data: session }                        = useSession()
  const safeType: FollowEntityType               = followType ?? 'player'
  const safeId                                   = followId ?? ''
  const isFollowingReal                          = useIsFollowing(safeType, safeId)
  const { mutate: doFollow, isPending: pending } = useToggleFollow(safeType, safeId)
  const { mutate: doReact }                      = useToggleReaction(eventId ?? '')

  const authed      = !!session
  const hasFollow   = !!(followType && followId)
  const isFollowing = (authed && hasFollow) ? isFollowingReal : false

  // Local optimistic reactions (demo / not authed / no eventId)
  const [localReaction, setLocalReaction] = useState<ReactionType | null>(null)
  const [localCounts,   setLocalCounts]   = useState<Record<ReactionType, number>>(
    { fire: 0, heart: 0, clap: 0, sad: 0 },
  )

  // Save state — initialised from localStorage after mount
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    if (saveKey) setSaved(getSaved().has(saveKey))
  }, [saveKey])

  const counts: Record<ReactionType, number> = (authed && eventId)
    ? (() => {
        const c: Record<ReactionType, number> = { fire: 0, heart: 0, clap: 0, sad: 0 }
        reactions.forEach(r => { c[r.reaction]++ })
        return c
      })()
    : localCounts

  const myReaction: ReactionType | null = (authed && eventId)
    ? (reactions.find(r => r.user_id === session!.user.id)?.reaction ?? null)
    : localReaction

  function handleReaction(type: ReactionType) {
    if (authed && eventId) { doReact(type); return }
    setLocalReaction(prev => {
      const same = prev === type
      setLocalCounts(c => {
        const next = { ...c }
        if (prev)  next[prev] = Math.max(0, next[prev] - 1)
        if (!same) next[type] = next[type] + 1
        return next
      })
      return same ? null : type
    })
  }

  function handleFollow() {
    if (authed) { doFollow() }
  }

  function handleSave() {
    if (!saveKey) return
    setSaved(toggleSaved(saveKey))
  }

  async function handleShare() {
    const title = shareTitle ?? 'Bowlkollen'
    const url   = shareUrl   ?? window.location.href
    try {
      if (navigator.share) { await navigator.share({ title, url }) }
      else                 { await navigator.clipboard.writeText(url) }
    } catch { /* user cancelled */ }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: `${SPACE[3]}px ${SPACE[3]}px ${SPACE[3]}px`,
    }}>

      {/* Left: reactions */}
      <div style={{ display: 'flex', gap: SPACE[2] }}>
        {REACTIONS.map(({ type, Icon }) => {
          const active = myReaction === type
          const count  = counts[type]
          const isFire = type === 'fire'
          const activeColor = isFire ? COLOR.gold : COLOR.red
          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.80 }}
              onClick={() => handleReaction(type)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 8px',
                background: 'transparent', border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon
                size={20}
                strokeWidth={active ? 0 : 1.6}
                color={active ? activeColor : COLOR.ink}
                fill={active ? activeColor : 'none'}
              />
              {count > 0 && (
                <span style={{
                  fontSize: TYPE.label, fontWeight: 600, lineHeight: 1,
                  color: COLOR.ink,
                }}>
                  {count}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Right: share + follow→save */}
      <div style={{ display: 'flex', gap: SPACE[2], alignItems: 'center' }}>
        {/* Share */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleShare}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32,
            background: 'transparent', border: 'none',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Share2 size={20} strokeWidth={1.6} color={COLOR.ink} />
        </motion.button>

        {/* Save — shown when following, or when there's no follow entity (e.g. match rows) */}
        {saveKey && (isFollowing || !hasFollow) && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32,
              background: 'transparent', border: 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saved
              ? <BookmarkCheck size={20} strokeWidth={2}   color={COLOR.gold} />
              : <Bookmark      size={20} strokeWidth={1.8} color={COLOR.ink} />
            }
          </motion.button>
        )}

        {/* Follow — shown until following, only when a follow target is defined */}
        {hasFollow && !isFollowing && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleFollow}
            disabled={authed && pending}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 8px',
              background: 'transparent', border: 'none',
              cursor: authed && pending ? 'default' : 'pointer',
              opacity: authed && pending ? 0.6 : 1,
              transition: 'opacity 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <UserPlus size={20} strokeWidth={1.6} color={COLOR.ink} />
            <span style={{ fontSize: TYPE.caption, fontWeight: 600, color: COLOR.ink }}>
              Följ
            </span>
          </motion.button>
        )}
      </div>

    </div>
  )
}
