'use client'

import LiveCard from './LiveCard'
import BitsMatchRow from './BitsMatchRow'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
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
  color: COLOR.ink2, marginBottom: 12,
}

export function MatcherTab({ live, bitsRecent, bitsUpcoming, isLoading }: {
  live: Match[]
  bitsRecent: BitsMatchFeed[]
  bitsUpcoming: BitsMatchFeed[]
  isLoading: boolean
}) {
  if (isLoading) return <FeedSkeleton />

  return (
    <>
      {live.length > 0 && (
        <section style={{ padding: '16px 20px 0' }}>
          <div style={sectionLabel}>PÅGÅR NU</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {live.map(m => <LiveCard key={m.id} m={m} />)}
          </div>
        </section>
      )}
      {bitsRecent.length > 0 && (
        <section style={{ padding: '24px 20px 0' }}>
          <div style={sectionLabel}>SENASTE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bitsRecent.map((m, i) => <BitsMatchRow key={m.bits_match_id} m={m} index={i} />)}
          </div>
        </section>
      )}
      {bitsUpcoming.length > 0 && (
        <section style={{ padding: '24px 20px 0' }}>
          <div style={sectionLabel}>KOMMANDE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bitsUpcoming.map((m, i) => <BitsMatchRow key={m.bits_match_id} m={m} index={i} />)}
          </div>
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
