'use client'

import Link from 'next/link'
import { COLOR, SPACE } from '@/lib/brand'
import type { BitsMatchDetail } from '@/lib/types'
import { useMatchContext } from './use-match-context'

// Swedish ordinal suffix: 1:a, 2:a, then 3:e, 4:e … (första/andra vs tredje…).
const ord = (n: number) => `${n}${n <= 2 ? ':a' : ':e'}`

// Places the match in its season. Split into two parts so the layout can put the
// head-to-head (the matchup hook) up with the score, and the quieter standings
// line (→ division) below the divider. Free. Shares one fetch (cached by key).
export function SeasonContext({ match, tier, part }: { match: BitsMatchDetail; tier: string; part: 'h2h' | 'standings' }) {
  const { data } = useMatchContext(match.bits_division_id, match.season_id, match.home_bits_team_id, match.away_bits_team_id)
  if (!data) return null

  if (part === 'h2h') {
    const { h2h } = data
    if (!h2h) return null
    const text = h2h.homeWins === h2h.awayWins
      ? `${ord(h2h.meetings)} mötet · lika ${h2h.homeWins}–${h2h.awayWins}`
      : `${ord(h2h.meetings)} mötet · ${(h2h.homeWins > h2h.awayWins ? match.home_team_name : match.away_team_name).split(' ').slice(0, 3).join(' ')} leder ${Math.max(h2h.homeWins, h2h.awayWins)}–${Math.min(h2h.homeWins, h2h.awayWins)}`
    return <div style={{ textAlign: 'center', marginTop: SPACE[2], fontSize: 15, color: COLOR.ink2, fontWeight: 600 }}>{text}</div>
  }

  const { homeRank, awayRank } = data
  if (!homeRank && !awayRank) return null
  const inner = (
    <span>
      {homeRank && <b style={{ color: COLOR.ink2, fontWeight: 700 }}>{match.home_team_name} {ord(homeRank)}</b>}
      {homeRank && awayRank && <span style={{ color: COLOR.ink4 }}> · </span>}
      {awayRank && <b style={{ color: COLOR.ink2, fontWeight: 700 }}>{match.away_team_name} {ord(awayRank)}</b>}
      {' '}i {tier}
    </span>
  )
  return (
    <div style={{ fontSize: 14, color: COLOR.ink3 }}>
      {match.bits_division_id
        ? <Link href={`/divisioner/${match.bits_division_id}`} style={{ color: 'inherit', textDecoration: 'none', borderBottom: `1px solid ${COLOR.hairline}` }}>{inner}</Link>
        : inner}
    </div>
  )
}
