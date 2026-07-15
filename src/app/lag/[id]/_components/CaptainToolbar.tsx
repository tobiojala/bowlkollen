'use client'

import Link from 'next/link'
import { CalendarCheck, ListChecks } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { shortName } from '@/lib/utils'
import type { MatchRow } from '@/lib/division-standings'
import type { TeamClaimState } from '@/lib/queries'

type Props = {
  teamId:   number
  claim:    TeamClaimState
  upcoming: MatchRow[]
}

function fmtShort(iso: string) {
  return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Captain: quick links to run availability + lineup for the next matches.
 * Verified non-captain: a lighter single "kan du spela?" prompt. Nothing for
 * anyone else — this is internal team tooling, not part of the public page. */
export function CaptainToolbar({ teamId, claim, upcoming }: Props) {
  if (!claim || claim.status !== 'verified' || upcoming.length === 0) return null

  const opponentOf = (m: MatchRow) => shortName(m.home_bits_team_id === teamId ? m.away_team_name : m.home_team_name)

  if (claim.role !== 'captain') {
    const next = upcoming[0]
    return (
      <Link href={`/lag/${teamId}/tillganglighet/${next.bits_match_id}`} style={{
        display: 'block', marginTop: SPACE[4], padding: SPACE[3], borderRadius: RADIUS.lg,
        background: COLOR.surface, textDecoration: 'none',
      }}>
        <span style={{ fontSize: TYPE.body, fontWeight: 700, color: COLOR.ink }}>Kan du spela mot {opponentOf(next)}?</span>
        <span style={{ display: 'block', fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 2 }}>{fmtShort(next.match_date)} — svara här</span>
      </Link>
    )
  }

  return (
    <div style={{ marginTop: SPACE[4], background: COLOR.surface, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
      <div style={{ padding: `${SPACE[2]}px ${SPACE[3]}px`, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.gold }}>
        KAPTENSVERKTYG
      </div>
      {upcoming.map(m => (
        <div key={m.bits_match_id} style={{
          display: 'flex', alignItems: 'center', gap: SPACE[2],
          padding: `${SPACE[2]}px ${SPACE[3]}px`, borderTop: `1px solid ${COLOR.hairline}`,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              vs {opponentOf(m)}
            </div>
            <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{fmtShort(m.match_date)}</div>
          </div>
          <Link href={`/lag/${teamId}/tillganglighet/${m.bits_match_id}`} aria-label="Tillgänglighet" style={{ display: 'flex', padding: 8, background: COLOR.surface2, borderRadius: RADIUS.md, color: COLOR.ink2 }}>
            <CalendarCheck size={16} />
          </Link>
          <Link href={`/lag/${teamId}/laguttagning/${m.bits_match_id}`} aria-label="Laguttagning" style={{ display: 'flex', padding: 8, background: COLOR.surface2, borderRadius: RADIUS.md, color: COLOR.ink2 }}>
            <ListChecks size={16} />
          </Link>
        </div>
      ))}
    </div>
  )
}
