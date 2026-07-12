'use client'

import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import type { TeamStanding } from '@/lib/division-standings'

const th: React.CSSProperties = {
  fontSize: 12, fontWeight: 800, letterSpacing: '0.04em',
  color: COLOR.ink2, padding: `0 ${SPACE[2]}px ${SPACE[3]}px`,
  textAlign: 'right', whiteSpace: 'nowrap',
}
const num: React.CSSProperties = {
  fontSize: 14, fontWeight: 700,
  fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums',
  textAlign: 'right', padding: `${SPACE[3]}px ${SPACE[2]}px`,
  color: COLOR.ink2,
}

/** Cardless standings — rows on whatever surface hosts them (the sheet). */
export function DivisionStandings({ standings, tierColor }: { standings: TeamStanding[]; tierColor: string }) {
  if (standings.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, padding: `${SPACE[8]}px ${SPACE[4]}px` }}>
        Tabellen fylls när säsongen börjar
      </div>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ ...th, textAlign: 'left', paddingLeft: 0, width: 22 }}>#</th>
          <th style={{ ...th, textAlign: 'left', paddingRight: SPACE[4] }}>LAG</th>
          <th style={th}>M</th>
          <th style={th}>V</th>
          <th style={th}>O</th>
          <th style={th}>F</th>
          <th style={th}>BP</th>
          <th style={{ ...th, color: tierColor }}>P</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((s, i) => {
          const leader = i === 0
          return (
            <tr key={s.teamId} style={{ borderTop: `1px solid ${COLOR.hairline}` }}>
              <td style={{ ...num, textAlign: 'left', paddingLeft: 0, width: 22, color: leader ? COLOR.gold : COLOR.ink2 }}>
                {i + 1}
              </td>
              <td style={{
                padding: `${SPACE[3]}px ${SPACE[4]}px ${SPACE[3]}px 0`,
                fontSize: TYPE.body, fontWeight: leader ? 800 : 700, color: COLOR.ink,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150,
              }}>
                {s.teamName}
              </td>
              <td style={num}>{s.played}</td>
              <td style={{ ...num, color: s.won > 0 ? COLOR.ink : COLOR.ink2 }}>{s.won}</td>
              <td style={num}>{s.drawn}</td>
              <td style={num}>{s.lost}</td>
              <td style={num}>{s.boardWins}–{s.boardLosses}</td>
              <td style={{ ...num, fontSize: 16, fontWeight: 900, color: leader ? COLOR.gold : COLOR.ink }}>
                {s.points}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
