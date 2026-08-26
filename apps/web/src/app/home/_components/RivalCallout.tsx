'use client'

import Link from 'next/link'
import { COLOR, SPACE, TYPE, FONT } from '@/lib/brand'
import { teamColor, teamInitials } from '@/lib/utils'
import { useNextMatch } from '@/lib/diary'
import { usePlayerScouting } from '@/lib/scouting'

const MIN_MEETINGS = 2

function relativeMatchDate(iso: string): string {
  const d = Math.round((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
  if (d <= 0) return 'Idag'
  if (d === 1) return 'Imorgon'
  if (d <= 6) return `Om ${d} dagar`
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

// Pre-match rivalry: for your next fixture, the opponent you most need to watch —
// your career head-to-head vs them. Web port of native's RivalCard. Renders
// nothing unless you're a claimed player facing a team you've real history with.
// Opens the prep sheet (full scouting).
export function RivalCallout() {
  const { data: next } = useNextMatch()
  const matchTeams = next
    ? {
        homeTeamId: next.isHome ? next.myTeamId : next.opponentId,
        awayTeamId: next.isHome ? next.opponentId : next.myTeamId,
        homeName: next.isHome ? next.myTeamName : next.opponentName,
        awayName: next.isHome ? next.opponentName : next.myTeamName,
      }
    : null
  const { data: scouting } = usePlayerScouting(matchTeams)

  if (!next || !scouting) return null
  const rival = scouting.opponents.find((o) => o.meetings >= MIN_MEETINGS)
  if (!rival) return null

  const lead = rival.myWins > rival.myLosses
  const trail = rival.myWins < rival.myLosses
  const standing = lead ? 'Du leder' : trail ? 'Du ligger under' : 'Helt jämnt'
  const recColor = lead ? COLOR.green : trail ? COLOR.red : COLOR.ink2
  const av = teamColor(rival.name, true)

  return (
    <Link href={`/prep/${next.matchId}`}
      style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], textDecoration: 'none',
        borderBottom: `1px solid ${COLOR.hairline}`, padding: `${SPACE[6]}px ${SPACE[3]}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.gold, letterSpacing: '0.1em' }}>RIVALITET</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink3 }}>{relativeMatchDate(next.date)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: av.bg, border: `1.5px solid ${av.border}`, color: av.text, fontSize: 13, fontWeight: 800 }}>
            {teamInitials(rival.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: TYPE.body, fontWeight: 700, color: COLOR.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Du möter {rival.name}
            </div>
            <div style={{ fontSize: 13, color: COLOR.ink3, marginTop: 2 }}>
              {standing}{' '}
              <span style={{ fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: recColor }}>
                {rival.myWins}–{rival.myLosses}
              </span>{' '}· {rival.meetings} möten
            </div>
          </div>
        </div>
    </Link>
  )
}
