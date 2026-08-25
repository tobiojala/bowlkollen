'use client'

import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'

// MATCHENS BÄSTA — the single highest individual total of the match, in gold.
// Parity with native. Tap → the player's profile.
export function MatchBest({ name, teamName, total, publicId }: {
  name: string; teamName: string; total: number; publicId: string | null
}) {
  const inner = (
    <>
      <Trophy size={20} color={COLOR.gold} strokeWidth={2} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.12em', color: COLOR.gold }}>MATCHENS BÄSTA</span>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: COLOR.ink, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <span style={{ display: 'block', fontSize: TYPE.caption, color: COLOR.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamName}</span>
      </span>
      <span style={{ flexShrink: 0, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 32, fontWeight: 900, color: COLOR.gold }}>{total}</span>
    </>
  )
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: SPACE[3],
    background: `${COLOR.gold}14`, borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px`, textDecoration: 'none',
  }
  return publicId
    ? <Link href={`/players/${publicId}`} style={style}>{inner}</Link>
    : <div style={style}>{inner}</div>
}
