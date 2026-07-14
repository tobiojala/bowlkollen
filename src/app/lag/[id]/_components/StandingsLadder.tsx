'use client'

import Link from 'next/link'
import { COLOR, SPACE } from '@/lib/brand'
import { shortName } from '@/lib/utils'
import { standingsNeighbors, type TeamStanding } from '@/lib/division-standings'

type Props = {
  teamId:      number
  divisionId:  number
  standings:   TeamStanding[]
  /** True when `standings` is last season's final table, shown because this
   * season hasn't produced a finished match yet. */
  historical?: boolean
}

/** Who's chasing, who's being chased — a compact window around this team's
 * spot, not the full table (that's one tap away via the division page). */
export function StandingsLadder({ teamId, divisionId, standings, historical = false }: Props) {
  const rows = standingsNeighbors(standings, teamId, 2)
  if (rows.length === 0) return null

  const startRank = standings.findIndex(s => s.teamId === rows[0].teamId) + 1

  return (
    <section style={{ marginTop: SPACE[6] }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '0 20px 10px',
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2 }}>
          {historical ? 'TABELLEN — FÖRRA SÄSONGEN' : 'TABELLEN'}
        </span>
        <Link href={`/divisioner/${divisionId}`} style={{ fontSize: 13, fontWeight: 600, color: COLOR.ink2, textDecoration: 'none' }}>
          Hela tabellen →
        </Link>
      </div>

      {rows.map((s, i) => {
        const isTeam = s.teamId === teamId
        return (
          <Link key={s.teamId} href={`/lag/${s.teamId}`} style={{
            display: 'flex', alignItems: 'center', gap: SPACE[3],
            padding: '10px 20px', borderTop: `1px solid ${COLOR.hairline}`,
            background: isTeam ? 'rgba(245,194,0,0.08)' : 'transparent',
            textDecoration: 'none', WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{ width: 20, flexShrink: 0, fontSize: 13, fontWeight: 700, color: isTeam ? COLOR.gold : COLOR.ink3 }}>
              {startRank + i}
            </span>
            <span style={{
              flex: 1, minWidth: 0, fontSize: 15, fontWeight: isTeam ? 800 : 600,
              color: isTeam ? COLOR.ink : COLOR.ink2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {shortName(s.teamName)}
            </span>
            <span style={{ fontSize: 13, color: COLOR.ink3, whiteSpace: 'nowrap' }}>{s.played} sp</span>
            <span style={{ width: 28, flexShrink: 0, textAlign: 'right', fontSize: 15, fontWeight: 800, color: isTeam ? COLOR.gold : COLOR.ink }}>
              {s.points}
            </span>
          </Link>
        )
      })}
    </section>
  )
}
