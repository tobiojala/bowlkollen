'use client'

import Link from 'next/link'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'

const label = (s: number) => `${s}/${String((s + 1) % 100).padStart(2, '0')}`

// Season picker (newest first) — links to ?season=, so switching is server-side
// (ISR-friendly). Shared look with native SeasonPills; hidden when there's one.
export function SeasonPills({ divisionId, seasons, selected, teamId }: {
  divisionId: number; seasons: number[]; selected: number; teamId: number | null
}) {
  if (seasons.length < 2) return null
  const href = (s: number) => {
    const q = new URLSearchParams()
    q.set('season', String(s))
    if (teamId != null) q.set('team', String(teamId))
    return `/divisioner/${divisionId}?${q.toString()}`
  }
  return (
    <div style={{ display: 'flex', gap: SPACE[2], overflowX: 'auto', marginTop: SPACE[4], paddingBottom: SPACE[1] }}>
      {seasons.map(s => {
        const on = s === selected
        return (
          <Link key={s} href={href(s)} scroll={false} style={{
            flexShrink: 0, textDecoration: 'none',
            padding: `${SPACE[2]}px ${SPACE[4]}px`, borderRadius: RADIUS.pill,
            background: on ? 'rgba(245,194,0,0.14)' : COLOR.surface,
            color: on ? COLOR.gold : COLOR.ink2,
            fontSize: TYPE.caption, fontWeight: 700, fontFamily: FONT.body,
          }}>
            {label(s)}
          </Link>
        )
      })}
    </div>
  )
}
