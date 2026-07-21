'use client'

import { COLOR, FONT } from '@/lib/brand'
import { useColors } from '@/components/ThemeProvider'
import type { TeamStanding } from './bracket'

type Props = {
  standings: TeamStanding[]
  division:  'Herrar' | 'Damer'
}

const SM_SPOTS = 4
const GOLD     = COLOR.gold

export function QualifierTable({ standings, division }: Props) {
  const { C } = useColors()

  if (standings.length === 0) return null

  return (
    <div style={{ padding: '20px 16px 0' }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: 0.5 }}>
          Slutlig tabell — Elitserien {division}
        </span>
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 32px 32px 32px 32px 36px',
        gap: 4, padding: '6px 0 6px 4px' }}>
        {['#', 'Lag', 'M', 'V', 'F', 'O', 'P'].map(h => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted,
            textAlign: h === 'Lag' ? 'left' : 'center' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div>
        {standings.map((row, i) => {
          const qualifies = row.pos <= SM_SPOTS

          return (
            <div key={row.team} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 32px 32px 32px 32px 36px',
              gap: 4, padding: '10px 0 10px 4px',
              borderTop: `1px solid ${C.border}`,
              borderLeft: qualifies ? `2px solid ${GOLD}` : '2px solid transparent',
              paddingLeft: qualifies ? 10 : 4,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted,
                textAlign: 'center', alignSelf: 'center' }}>
                {row.pos}
              </span>

              <span style={{ fontSize: 14, fontWeight: qualifies ? 700 : 400,
                color: C.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                alignSelf: 'center' }}>
                {row.team}
              </span>

              {[row.played, row.won, row.lost, row.drawn].map((v, j) => (
                <span key={j} style={{ fontSize: 12, fontWeight: 400, color: C.textMuted,
                  textAlign: 'center', alignSelf: 'center' }}>
                  {v}
                </span>
              ))}

              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT.display,
                color: C.text, textAlign: 'center', alignSelf: 'center' }}>
                {row.points}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
        <div style={{ width: 2, height: 12, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: C.textMuted }}>
          Kvalificerat till SM-slutspel
        </span>
      </div>

      <p style={{ fontSize: 11, color: C.textMuted, marginTop: 8, lineHeight: 1.6 }}>
        Obs: Poängtabellen approximeras på totalt antal pinnar. Officiell tabell baseras på banpresultat.
      </p>
    </div>
  )
}
