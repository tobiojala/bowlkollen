'use client'

import { COLOR, FONT, SPACE, TYPE } from '@/lib/brand'
import { usePro } from '@/lib/pro'
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
  const showDeltas = usePro() // Pro: snitt-delta per serie
  return (
    <div>
      <div style={{ fontSize: TYPE.caption, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3, marginBottom: SPACE[4] }}>
        SPELRESULTAT
      </div>

      {/* Per-serie team comparison */}
      <div style={{ display: 'flex', gap: SPACE[3], padding: `${SPACE[2]}px 0`, marginBottom: SPACE[4], borderBottom: `1px solid ${COLOR.hairline}` }}>
        <div style={{ flex: 1, minWidth: 0 }} />
        <div style={{ display: 'flex', gap: SPACE[2] }}>
          {Array.from({ length: serieCount }, (_, i) => (
            <span key={i} style={{ width: 36, textAlign: 'center', fontSize: TYPE.micro, fontWeight: 700, color: COLOR.ink4 }}>S{i + 1}</span>
          ))}
        </div>
        <span style={{ width: 40 }} />
      </div>
      {([
        { name: homeTeamName, series: homeSeries, won: homeWon },
        { name: awayTeamName, series: awaySeries, won: awayWon },
      ] as const).map(team => (
        <div key={team.name} style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[2]}px 0` }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: TYPE.body, fontWeight: team.won ? 700 : 500, color: team.won ? COLOR.ink : COLOR.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {team.name}
          </div>
          <div style={{ display: 'flex', gap: SPACE[2] }}>
            {team.series.map((v, i) => (
              <span key={i} style={{ width: 36, textAlign: 'center', fontSize: 15, fontVariantNumeric: 'tabular-nums', color: COLOR.ink2 }}>{v}</span>
            ))}
          </div>
          <span style={{ width: 40, textAlign: 'right', fontSize: TYPE.body, fontWeight: 700, fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums', color: team.won ? COLOR.ink : COLOR.ink3 }}>
            {team.series.reduce((a, b) => a + b, 0)}
          </span>
        </div>
      ))}

      <div style={{ marginTop: SPACE[6] }}>
        <TeamScoreSection teamName={homeTeamName} players={homePlayers} serieCount={serieCount} total={homeSeries.reduce((a, b) => a + b, 0)} isWinner={homeWon} showDeltas={showDeltas} />
        <TeamScoreSection teamName={awayTeamName} players={awayPlayers} serieCount={serieCount} total={awaySeries.reduce((a, b) => a + b, 0)} isWinner={awayWon} showDeltas={showDeltas} />
      </div>
    </div>
  )
}
