'use client'

import Link from 'next/link'
import { Flame } from 'lucide-react'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { SCORE } from '@/lib/constants'
import FollowButton from '@/components/FollowButton'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { PostActions } from './PostActions'
import { SerieBars } from './SerieBars'
import type { BitsTopScore } from '@/lib/types'
import type { ReactionState } from '@/lib/feed-reactions'

function fmtDate(iso: string) {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Top-series post (native's TopSerieCard): player header + follow, the total as
// the hero (gold when elite), the game graph, timestamp, and the action row.
export function TopScoreCard({ item, reaction, onLike, onSave }: {
  item: BitsTopScore
  reaction: ReactionState
  onLike: (key: string, liked: boolean) => void
  onSave: (key: string, saved: boolean) => void
}) {
  const gold = item.total >= SCORE.SERIES_HIGH
  const postKey = `s${item.matchId}-${item.playerName}`

  return (
    <div style={{ borderBottom: `1px solid ${COLOR.hairline}`, padding: `${SPACE[6]}px ${SPACE[3]}px`, display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
      {/* meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.gold }}>
          <Flame size={13} color={COLOR.gold} /> TOPPSERIE
        </span>
        {item.division && <span style={{ flexShrink: 1, fontSize: TYPE.caption, fontWeight: 600, color: COLOR.ink3, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.division}</span>}
      </div>

      {/* header: player + follow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
        <Link href={item.publicId ? `/players/${item.publicId}` : '#'} style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], flex: 1, minWidth: 0, textDecoration: 'none' }}>
          <PlayerAvatar publicId={item.publicId} name={item.playerName} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.playerName}</div>
            <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 1 }}>mot {item.opponent}</div>
          </div>
        </Link>
        {item.publicId && <FollowButton entityType="player" entityId={item.publicId} size="sm" />}
      </div>

      {/* score block → match */}
      <Link href={`/matcher/${item.matchId}`} style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], textDecoration: 'none' }}>
        <span style={{ fontFamily: FONT.score, fontSize: 60, fontWeight: 800, letterSpacing: -2, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: gold ? COLOR.gold : COLOR.ink }}>{item.total}</span>
        <SerieBars series={item.series} />
        <span style={{ fontSize: TYPE.caption, color: COLOR.ink4 }}>{fmtDate(item.date)}</span>
      </Link>

      <PostActions
        postKey={postKey}
        liked={reaction.liked}
        saved={reaction.saved}
        likeCount={reaction.likes}
        onLike={onLike}
        onSave={onSave}
        shareMessage={`${item.playerName} · ${item.total} · Bowlkollen`}
        shareUrl={typeof location !== 'undefined' ? `${location.origin}/matcher/${item.matchId}` : undefined}
      />
    </div>
  )
}
