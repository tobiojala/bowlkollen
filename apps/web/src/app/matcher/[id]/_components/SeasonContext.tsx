'use client'

import Link from 'next/link'
import { COLOR, SPACE } from '@/lib/brand'
import type { BitsMatchDetail } from '@/lib/types'
import { useMatchContext } from './use-match-context'

// Swedish ordinal suffix: 1:a, 2:a, then 3:e, 4:e … (första/andra vs tredje…).
const ord = (n: number) => `${n}${n <= 2 ? ':a' : ':e'}`

// The line under the hero that places the match in its season — each team's
// standing (links to the division) + the head-to-head record. Free.
export function SeasonContext({ match, tier }: { match: BitsMatchDetail; tier: string }) {
  const { data } = useMatchContext(match.bits_division_id, match.season_id, match.home_bits_team_id, match.away_bits_team_id)
  if (!data) return null
  const { homeRank, awayRank, h2h } = data
  const divHref = match.bits_division_id ? `/divisioner/${match.bits_division_id}` : null

  const h2hText = h2h
    ? h2h.homeWins === h2h.awayWins
      ? `${h2h.meetings === 1 ? '1:a' : ord(h2h.meetings)} mötet — lika ${h2h.homeWins}–${h2h.awayWins}`
      : `${ord(h2h.meetings)} mötet — ${(h2h.homeWins > h2h.awayWins ? match.home_team_name : match.away_team_name).split(' ').slice(0, 2).join(' ')} leder ${Math.max(h2h.homeWins, h2h.awayWins)}–${Math.min(h2h.homeWins, h2h.awayWins)}`
    : null

  const rankPart = (homeRank || awayRank) && (
    <span>
      {homeRank && <b style={{ color: COLOR.ink2, fontWeight: 700 }}>{match.home_team_name} {ord(homeRank)}</b>}
      {homeRank && awayRank && <span style={{ color: COLOR.ink4 }}> · </span>}
      {awayRank && <b style={{ color: COLOR.ink2, fontWeight: 700 }}>{match.away_team_name} {ord(awayRank)}</b>}
      {' '}i {tier}
    </span>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], flexWrap: 'wrap', marginTop: SPACE[3], fontSize: 14, color: COLOR.ink3 }}>
      {rankPart && (divHref
        ? <Link href={divHref} style={{ color: 'inherit', textDecoration: 'none', borderBottom: `1px solid ${COLOR.hairline}` }}>{rankPart}</Link>
        : rankPart)}
      {rankPart && h2hText && <span style={{ color: COLOR.ink4 }}>·</span>}
      {h2hText && <span>{h2hText}</span>}
    </div>
  )
}
