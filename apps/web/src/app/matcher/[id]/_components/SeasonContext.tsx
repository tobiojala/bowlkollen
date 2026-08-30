'use client'

import Link from 'next/link'
import { COLOR } from '@/lib/brand'
import type { BitsMatchDetail } from '@/lib/types'
import { useMatchContext } from './use-match-context'

// Swedish ordinal suffix: 1:a, 2:a, then 3:e, 4:e … (första/andra vs tredje…).
const ord = (n: number) => `${n}${n <= 2 ? ':a' : ':e'}`

const pill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%',
  background: COLOR.surface, borderRadius: 999, padding: '8px 14px',
  fontSize: 14, fontWeight: 600, color: COLOR.ink2, textDecoration: 'none',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

// Places the match in its season, as small pills under the header: the head-to-
// head record and each team's division standing (→ division). Free; one shared
// fetch (cached by key). `part` lets the layout place the two pills.
export function SeasonContext({ match, tier, part }: { match: BitsMatchDetail; tier: string; part: 'h2h' | 'standings' }) {
  const { data } = useMatchContext(match.bits_division_id, match.season_id, match.home_bits_team_id, match.away_bits_team_id)
  if (!data) return null

  if (part === 'h2h') {
    const { h2h } = data
    if (!h2h) return null
    const text = h2h.homeWins === h2h.awayWins
      ? `${ord(h2h.meetings)} mötet · lika ${h2h.homeWins}–${h2h.awayWins}`
      : `${ord(h2h.meetings)} mötet · ${(h2h.homeWins > h2h.awayWins ? match.home_team_name : match.away_team_name).split(' ').slice(0, 3).join(' ')} leder ${Math.max(h2h.homeWins, h2h.awayWins)}–${Math.min(h2h.homeWins, h2h.awayWins)}`
    return <span style={pill}>{text}</span>
  }

  const { homeRank, awayRank } = data
  if (!homeRank && !awayRank) return null
  const inner = (
    <>
      {homeRank && <b style={{ color: COLOR.ink, fontWeight: 700 }}>{match.home_team_name.split(' ').slice(0, 3).join(' ')} {ord(homeRank)}</b>}
      {homeRank && awayRank && <span style={{ color: COLOR.ink4 }}> · </span>}
      {awayRank && <b style={{ color: COLOR.ink, fontWeight: 700 }}>{match.away_team_name.split(' ').slice(0, 3).join(' ')} {ord(awayRank)}</b>}
      <span style={{ color: COLOR.ink3, fontWeight: 500 }}> · {tier}</span>
    </>
  )
  return match.bits_division_id
    ? <Link href={`/divisioner/${match.bits_division_id}`} style={pill}>{inner}</Link>
    : <span style={pill}>{inner}</span>
}
