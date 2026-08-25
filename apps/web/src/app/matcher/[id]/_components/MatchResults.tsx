'use client'

import { COLOR, SPACE, TYPE } from '@/lib/brand'
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

      <TeamScoreSection teamName={homeTeamName} players={homePlayers} serieCount={serieCount} total={homeSeries.reduce((a, b) => a + b, 0)} isWinner={homeWon} showDeltas={showDeltas} />
      <TeamScoreSection teamName={awayTeamName} players={awayPlayers} serieCount={serieCount} total={awaySeries.reduce((a, b) => a + b, 0)} isWinner={awayWon} showDeltas={showDeltas} />
    </div>
  )
}
