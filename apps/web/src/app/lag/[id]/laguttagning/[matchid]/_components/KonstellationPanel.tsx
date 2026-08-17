'use client'

import Link from 'next/link'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { useKonstellationer } from '@/lib/lineup-aids'

const MIN_TOGETHER = 4 // enough shared bords to be a real pairing, not a fluke
const TOP_N = 4

type Person = { publicId: string; name: string }

// "Bästa konstellationer": among the lineup candidates, the pairs with the
// strongest historical 2-man record — so the captain can seat proven pairs.
// Win-rate tints green only when strong (never colour alone: the record carries it).
export function KonstellationPanel({ candidates }: { candidates: Person[] }) {
  const { data: pairs = [] } = useKonstellationer(candidates.map((c) => c.publicId))
  const nameById = new Map(candidates.map((c) => [c.publicId, c.name] as const))

  const top = pairs
    .filter((p) => p.together >= MIN_TOGETHER && nameById.has(p.aPublicId) && nameById.has(p.bPublicId))
    .sort((a, b) => b.winRate - a.winRate || b.together - a.together)
    .slice(0, TOP_N)

  if (!top.length) return null

  return (
    <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: `${SPACE[3]}px ${SPACE[4]}px`, marginBottom: SPACE[4] }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3, marginBottom: SPACE[1] }}>BÄSTA KONSTELLATIONER</div>
      {top.map((p) => {
        const aName = nameById.get(p.aPublicId)!
        const bName = nameById.get(p.bPublicId)!
        const pct = Math.round(p.winRate * 100)
        return (
          <div key={`${p.aPublicId}-${p.bPublicId}`}
            style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[3]}px 0`, borderTop: `1px solid ${COLOR.surface2}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/players/${p.aPublicId}`} style={{ display: 'block', fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aName}</Link>
              <Link href={`/players/${p.bPublicId}`} style={{ display: 'block', fontSize: TYPE.caption, fontWeight: 600, color: COLOR.ink2, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bName}</Link>
            </div>
            <div style={{ textAlign: 'right', minWidth: 78 }}>
              <div style={{ fontSize: TYPE.body, fontWeight: 800, color: COLOR.ink, fontVariantNumeric: 'tabular-nums' }}>{p.wins}–{p.losses}</div>
              <div style={{ fontSize: TYPE.caption, color: pct >= 60 ? COLOR.green : COLOR.ink3, fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{pct}% · {p.together} ihop</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
