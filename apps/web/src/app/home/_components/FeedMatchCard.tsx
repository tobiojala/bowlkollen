'use client'

import Link from 'next/link'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { IdentityAvatar } from '@/components/IdentityAvatar'
import { PostActions } from './PostActions'
import type { ReactionState } from '@/lib/feed-reactions'

export type MatchLike = {
  bitsMatchId: number; date: string
  homeTeam: string; awayTeam: string
  homeResult: number | null; awayResult: number | null
  division: string | null; hall: string | null; finished: boolean
}

function fmtDate(iso: string) {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function TeamLine({ name, score, won, finished }: { name: string; score: number | null; won: boolean; finished: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
      <IdentityAvatar name={name} size={40} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 22, letterSpacing: -0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontWeight: won ? 800 : 600, color: won ? COLOR.ink : finished ? COLOR.ink3 : COLOR.ink2 }}>
        {name}
      </span>
      {finished && score != null && (
        <span style={{ fontFamily: FONT.score, fontSize: 30, fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'right',
          color: won ? COLOR.ink : COLOR.ink3 }}>{score}</span>
      )}
    </div>
  )
}

// Match post — native's MatchCard: status kicker + division, a two-team avatar
// scoreboard (winner lit), a quiet footer, and the like/save/share row.
export function FeedMatchCard({ match, reaction, onLike, onSave }: {
  match: MatchLike
  reaction: ReactionState
  onLike: (key: string, liked: boolean) => void
  onSave: (key: string, saved: boolean) => void
}) {
  const finished = match.finished
  const homeWon = finished && (match.homeResult ?? 0) > (match.awayResult ?? 0)
  const awayWon = finished && (match.awayResult ?? 0) > (match.homeResult ?? 0)
  const postKey = `m${match.bitsMatchId}`

  return (
    <div style={{ borderBottom: `1px solid ${COLOR.hairline}`, padding: `${SPACE[6]}px ${SPACE[3]}px`, display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
      <Link href={`/matcher/${match.bitsMatchId}`} style={{ display: 'flex', flexDirection: 'column', gap: SPACE[4], textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] }}>
          <span style={{ fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.08em', color: finished ? COLOR.ink3 : COLOR.gold }}>
            {finished ? 'RESULTAT' : 'KOMMANDE'}
          </span>
          {match.division && <span style={{ flexShrink: 1, fontSize: TYPE.caption, fontWeight: 600, color: COLOR.ink3, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.division}</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
          <TeamLine name={match.homeTeam} score={match.homeResult} won={homeWon} finished={finished} />
          <TeamLine name={match.awayTeam} score={match.awayResult} won={awayWon} finished={finished} />
        </div>

        <span style={{ fontSize: TYPE.caption, color: COLOR.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[finished ? 'Banpoäng' : fmtDate(match.date), match.hall].filter(Boolean).join('  ·  ')}
        </span>
      </Link>

      <PostActions
        postKey={postKey}
        liked={reaction.liked}
        saved={reaction.saved}
        likeCount={reaction.likes}
        onLike={onLike}
        onSave={onSave}
        shareMessage={`${match.homeTeam} – ${match.awayTeam} · Bowlkollen`}
        shareUrl={typeof location !== 'undefined' ? `${location.origin}/matcher/${match.bitsMatchId}` : undefined}
      />
    </div>
  )
}
