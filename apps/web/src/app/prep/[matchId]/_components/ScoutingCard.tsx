'use client'

import Link from 'next/link'
import { usePlayerScouting, type ScoutMatch, type ScoutOpponent, type ScoutForm } from '@/lib/scouting'

const INK = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const INK4 = 'rgba(244,245,247,0.34)'
const GREEN = '#30d47e'
const RED = '#e05555'
const SURFACE = '#14171c'
const HAIR = 'rgba(244,245,247,0.08)'

const MIN_MEETINGS = 2
const MAX_ROWS = 6

// "Inför mötet" — the viewer's career head-to-head vs the opponent's roster,
// bogeys first. Meaning never colour-only: form dots carry V/F/O text.
export default function ScoutingCard({ match }: { match: ScoutMatch | null }) {
  const { data: scouting } = usePlayerScouting(match)
  if (!scouting) return null
  const rows = scouting.opponents.filter((o) => o.meetings >= MIN_MEETINGS).slice(0, MAX_ROWS)
  if (!rows.length) return null

  return (
    <div style={{ background: SURFACE, borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Inför mötet med {scouting.opponentName}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '10px 0 14px' }}>
        <span style={{ fontFamily: "var(--font-score,'Sora'),system-ui", fontSize: 24, fontWeight: 800, color: INK }}>
          {scouting.leadCount} / {scouting.total}
        </span>
        <span style={{ fontSize: 14, color: INK3 }}>möten du leder genom åren</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((o) => <OpponentRow key={o.publicId ?? o.name} o={o} />)}
      </div>
    </div>
  )
}

function OpponentRow({ o }: { o: ScoutOpponent }) {
  const tagColor = o.tag === 'bogey' ? RED : o.tag === 'favorit' ? GREEN : INK3
  const record = `${o.myWins}–${o.myLosses}${o.ties ? `–${o.ties}` : ''}`
  const inner = (
    <>
      <div style={{ width: 4, height: 32, borderRadius: 2, background: tagColor, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {o.recent.map((f, i) => <FormDot key={i} kind={f} />)}
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: tagColor, fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'right' }}>{record}</span>
    </>
  )
  const style: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: `1px solid ${HAIR}`, textDecoration: 'none', color: INK }
  return o.publicId
    ? <Link href={`/players/${o.publicId}`} style={style}>{inner}</Link>
    : <div style={style}>{inner}</div>
}

function FormDot({ kind }: { kind: ScoutForm }) {
  const bg = kind === 'V' ? 'rgba(48,212,126,0.16)' : kind === 'F' ? 'rgba(224,85,85,0.16)' : 'rgba(244,245,247,0.10)'
  const fg = kind === 'V' ? GREEN : kind === 'F' ? RED : INK4
  return (
    <span style={{ width: 18, height: 18, borderRadius: 5, background: bg, color: fg, fontSize: 11, fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kind}</span>
  )
}
