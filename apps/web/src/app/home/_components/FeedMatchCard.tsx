'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { IdentityAvatar } from '@/components/IdentityAvatar'
import { PostActions } from './PostActions'
import type { ReactionState } from '@/lib/feed-reactions'
import type { BitsMatchFeed } from '@/lib/types'

export type MatchLike = {
  bitsMatchId: number; date: string
  homeTeam: string; awayTeam: string
  homeResult: number | null; awayResult: number | null
  homeScore: number | null; awayScore: number | null
  division: string | null; hall: string | null; finished: boolean
}

// One place that turns a feed match row into the card's props — used by the
// Allt stream and the Matcher tab so both render the identical scorecard.
export function toMatchLike(m: BitsMatchFeed): MatchLike {
  return {
    bitsMatchId: m.bits_match_id, date: m.match_date, homeTeam: m.home_team_name, awayTeam: m.away_team_name,
    homeResult: m.home_result, awayResult: m.away_result, homeScore: m.home_score, awayScore: m.away_score,
    division: m.division_name, hall: m.hall_name, finished: m.is_finished,
  }
}

function fmtDate(iso: string) {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// One team row: avatar · name · ✓ (winner) · banpoäng · pinfall. Winner reads by
// weight + full ink + the check shape — never colour alone (senior-legible).
function TeamLine({ name, result, pins, won, finished }: {
  name: string; result: number | null; pins: number | null; won: boolean; finished: boolean
}) {
  const nameCol = won ? COLOR.ink : finished ? COLOR.ink3 : COLOR.ink2
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '40px minmax(0,1fr) 20px 44px 50px', alignItems: 'center', gap: SPACE[3] }}>
      <IdentityAvatar name={name} size={40} />
      <span style={{ minWidth: 0, fontSize: 20, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontWeight: won ? 800 : 600, color: nameCol }}>{name}</span>
      <span style={{ display: 'flex', justifyContent: 'center' }}>
        {won && <Check size={18} strokeWidth={3} color={COLOR.green} />}
      </span>
      {finished && result != null ? (
        <span style={{ fontFamily: FONT.score, fontSize: 27, fontWeight: 800, letterSpacing: -0.5, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
          color: won ? COLOR.ink : COLOR.ink3 }}>{result}</span>
      ) : <span />}
      {finished && pins != null ? (
        <span style={{ fontFamily: FONT.score, fontSize: 14, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
          color: won ? COLOR.ink3 : COLOR.ink4 }}>{pins}</span>
      ) : <span />}
    </div>
  )
}

// Match post — refined scorecard: status kicker + division, a stacked two-team
// scoreboard carrying banpoäng + pinfall with a ✓ winner marker, a banpoäng
// dominance bar (how decisive), a quiet footer, and the like/save/share row.
export function FeedMatchCard({ match, reaction, onLike, onSave }: {
  match: MatchLike
  reaction: ReactionState
  onLike: (key: string, liked: boolean) => void
  onSave: (key: string, saved: boolean) => void
}) {
  const finished = match.finished
  const hr = match.homeResult ?? 0, ar = match.awayResult ?? 0
  const homeWon = finished && hr > ar
  const awayWon = finished && ar > hr
  const total = hr + ar
  const homePct = finished && total > 0 ? Math.round((hr / total) * 100) : 50
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
          <TeamLine name={match.homeTeam} result={match.homeResult} pins={match.homeScore} won={homeWon} finished={finished} />
          <TeamLine name={match.awayTeam} result={match.awayResult} pins={match.awayScore} won={awayWon} finished={finished} />
        </div>

        {finished && total > 0 && (
          <div style={{ display: 'flex', height: 5, borderRadius: 999, overflow: 'hidden', background: COLOR.surface2 }}>
            <div style={{ width: `${homePct}%`, background: homeWon ? COLOR.ink : COLOR.ink3 }} />
            <div style={{ width: `${100 - homePct}%`, background: awayWon ? COLOR.ink : COLOR.ink3, marginLeft: 'auto' }} />
          </div>
        )}

        <span style={{ fontSize: TYPE.caption, color: COLOR.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[fmtDate(match.date), match.hall].filter(Boolean).join('  ·  ')}
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
