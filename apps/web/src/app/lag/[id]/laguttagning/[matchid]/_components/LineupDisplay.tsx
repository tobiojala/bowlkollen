'use client'

import Link from 'next/link'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { useTeamLineup } from '@/lib/queries'
import { shortName } from '@/lib/utils'

const BOARDS = [1, 2, 3, 4]

// A published laguppställning for a match, read-only — what fans and opponents see.
// Renders nothing until a lineup is published (get_team_lineup only returns a draft
// to verified teammates, so a public/opponent viewer sees nothing until it's out).
export function LineupDisplay({ teamId, matchId, subtitle }: { teamId: number; matchId: number; subtitle?: string }) {
  const { data: lineup } = useTeamLineup(teamId, matchId)
  if (!lineup || lineup.status !== 'published' || lineup.slots.length === 0) return null

  const starter = (bord: number, pos: number) => lineup.slots.find(s => !s.isReserve && s.bord === bord && s.pos === pos)
  const reserves = lineup.slots.filter(s => s.isReserve).sort((a, b) => a.pos - b.pos)

  return (
    <div style={{ marginTop: SPACE[6] }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACE[3] }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3 }}>LAGUPPSTÄLLNING</span>
        {subtitle && <span style={{ fontSize: TYPE.caption, color: COLOR.ink3, flexShrink: 1, marginLeft: SPACE[3] }}>{subtitle}</span>}
      </div>
      {BOARDS.map(bord => (
        <div key={bord} style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], marginBottom: SPACE[2] }}>
          <span style={{ width: 20, textAlign: 'center', color: COLOR.ink4, fontWeight: 800, fontSize: 18, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{bord}</span>
          <div style={{ flex: 1, display: 'flex', gap: SPACE[3] }}>
            {[1, 2].map(pos => {
              const s = starter(bord, pos)
              return (
                <div key={pos} style={{ flex: 1, minWidth: 0, background: COLOR.surface, borderRadius: RADIUS.md, padding: `${SPACE[2]}px ${SPACE[3]}px`, minHeight: 40, display: 'flex', alignItems: 'center' }}>
                  {s ? (
                    <Link href={`/players/${s.publicId}`} style={{ fontSize: TYPE.caption, fontWeight: 600, color: COLOR.ink, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(s.playerName)}</Link>
                  ) : (
                    <span style={{ color: COLOR.ink4, fontSize: TYPE.body }}>—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {reserves.length > 0 && (
        <p style={{ fontSize: TYPE.caption, color: COLOR.ink2, marginTop: SPACE[2], lineHeight: 1.5 }}>
          <span style={{ color: COLOR.ink3, fontWeight: 800 }}>Reserver: </span>{reserves.map(r => r.playerName).join(', ')}
        </p>
      )}
    </div>
  )
}
