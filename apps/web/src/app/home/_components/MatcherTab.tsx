'use client'

import LiveCard from './LiveCard'
import { FeedMatchCard, toMatchLike } from './FeedMatchCard'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { useFeedReactions, useReactionActions } from '@/lib/feed-reactions'
import type { Match, BitsMatchFeed } from '@/lib/types'

function FeedSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: `8px ${SPACE[4]}px 0` }}>
      {[88, 100, 88].map((h, i) => (
        <div key={i} className="skeleton" style={{
          height: h, borderRadius: RADIUS.lg,
          background: COLOR.surface, border: `1px solid ${COLOR.hairline}`,
        }} />
      ))}
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.1em',
  color: COLOR.ink2, padding: `0 ${SPACE[3]}px`, marginBottom: SPACE[2],
}

// The Matcher filter — same refined scorecard as the Allt stream, only grouped
// into live / recent / upcoming so the tab reads as a schedule, not a mixed feed.
export function MatcherTab({ live, bitsRecent, bitsUpcoming, isLoading }: {
  live: Match[]
  bitsRecent: BitsMatchFeed[]
  bitsUpcoming: BitsMatchFeed[]
  isLoading: boolean
}) {
  const postKeys = [...bitsRecent, ...bitsUpcoming].map(m => `m${m.bits_match_id}`)
  const { data: reactions } = useFeedReactions(postKeys)
  const { toggleLike, toggleSave } = useReactionActions()

  if (isLoading) return <FeedSkeleton />

  const card = (m: BitsMatchFeed) => (
    <FeedMatchCard
      key={m.bits_match_id}
      match={toMatchLike(m)}
      reaction={reactions?.get(`m${m.bits_match_id}`) ?? { likes: 0, liked: false, saved: false }}
      onLike={toggleLike}
      onSave={toggleSave}
    />
  )

  return (
    <>
      {live.length > 0 && (
        <section style={{ padding: '16px 0 0' }}>
          <div style={sectionLabel}>PÅGÅR NU</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: `0 ${SPACE[4]}px` }}>
            {live.map(m => <LiveCard key={m.id} m={m} />)}
          </div>
        </section>
      )}
      {bitsRecent.length > 0 && (
        <section style={{ padding: '24px 0 0' }}>
          <div style={sectionLabel}>SENASTE</div>
          {bitsRecent.map(card)}
        </section>
      )}
      {bitsUpcoming.length > 0 && (
        <section style={{ padding: '24px 0 0' }}>
          <div style={sectionLabel}>KOMMANDE</div>
          {bitsUpcoming.map(card)}
        </section>
      )}
      {live.length === 0 && bitsRecent.length === 0 && bitsUpcoming.length === 0 && (
        <div style={{ padding: '48px 20px', textAlign: 'center', color: COLOR.ink4, fontSize: 13 }}>
          Inga matcher just nu.
        </div>
      )}
    </>
  )
}
