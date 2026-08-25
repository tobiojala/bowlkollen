'use client'

import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { TeamScoreSection, type PlayerLine } from './TeamScoreSection'

// SPELRESULTAT — per-serie team comparison + each team's full per-player lines.
// Extracted from MatcherClient to keep that file under the size budget.
export function MatchResults({
  homeTeamName, awayTeamName, serieCount, homeSeries, awaySeries, homePlayers, awayPlayers, homeWon, awayWon,
}: {
  homeTeamName: string; awayTeamName: string; serieCount: number
  homeSeries: number[]; awaySeries: number[]
  homePlayers: PlayerLine[]; awayPlayers: PlayerLine[]
  homeWon: boolean; awayWon: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink3, marginBottom: SPACE[4] }}>
        SPELRESULTAT
      </div>

      {/* Per-serie team comparison */}
      <div style={{ display: 'flex', gap: SPACE[2], padding: `${SPACE[2]}px 0`, marginBottom: SPACE[6], borderBottom: `1px solid ${COLOR.hairline}` }}>
        <div style={{ flex: 1, minWidth: 0 }} />
        <div style={{ display: 'flex', gap: SPACE[2] }}>
          {Array.from({ length: serieCount }, (_, i) => (
            <span key={i} style={{ width: 28, textAlign: 'center', fontSize: 9, fontWeight: 700, color: COLOR.ink4 }}>S{i + 1}</span>
          ))}
        </div>
        <span style={{ width: 34 }} />
      </div>
      {([
        { name: homeTeamName, series: homeSeries, won: homeWon },
        { name: awayTeamName, series: awaySeries, won: awayWon },
      ] as const).map(team => (
        <div key={team.name} style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], padding: '4px 0' }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: TYPE.caption, fontWeight: team.won ? 700 : 500, color: team.won ? COLOR.ink : COLOR.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {team.name}
          </div>
          <div style={{ display: 'flex', gap: SPACE[2] }}>
            {team.series.map((v, i) => (
              <span key={i} style={{ width: 28, textAlign: 'center', fontSize: TYPE.caption, fontVariantNumeric: 'tabular-nums', color: COLOR.ink2 }}>{v}</span>
            ))}
          </div>
          <span style={{ width: 34, textAlign: 'right', fontSize: TYPE.caption, fontWeight: 700, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums', color: team.won ? COLOR.ink : COLOR.ink3 }}>
            {team.series.reduce((a, b) => a + b, 0)}
          </span>
        </div>
      ))}

      <div style={{ marginTop: SPACE[6] }}>
        <TeamScoreSection teamName={homeTeamName} players={homePlayers} serieCount={serieCount} total={homeSeries.reduce((a, b) => a + b, 0)} isWinner={homeWon} />
        <TeamScoreSection teamName={awayTeamName} players={awayPlayers} serieCount={serieCount} total={awaySeries.reduce((a, b) => a + b, 0)} isWinner={awayWon} />
      </div>
    </div>
  )
}
