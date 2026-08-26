'use client'

import Link from 'next/link'
import { ArrowUp } from 'lucide-react'
import { COLOR, SPACE, TYPE, FONT } from '@/lib/brand'
import { shortName, teamColor, teamInitials, shortDiv } from '@/lib/utils'
import type { FeedStanding } from '@/lib/feed-standings'

// A team's achievement told with the standings as context: what they did up top,
// then the tight ladder around them. Web port of native's feed/StandingsCard —
// same content, drawn in web's cardless hairline-list language. Opens the
// division; each ladder row opens the team.
export function StandingsCard({ standing }: { standing: FeedStanding }) {
  const av = teamColor(standing.teamName, true)
  const chip = standing.delta > 0

  return (
    <div style={{ borderBottom: `1px solid ${COLOR.hairline}`, padding: `${SPACE[6]}px ${SPACE[3]}px`, display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>

      <Link href={`/divisioner/${standing.divisionId}`} style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.ink3, letterSpacing: '0.08em' }}>{standing.badge}</span>
          <span style={{ fontSize: 13, color: COLOR.ink3 }}>{shortDiv(standing.division)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: av.bg, border: `1.5px solid ${av.border}`, color: av.text, fontSize: 13, fontWeight: 800 }}>
            {teamInitials(standing.teamName)}
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: TYPE.body, fontWeight: 700, color: COLOR.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {standing.teamName}
          </div>
          {chip && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '3px 10px', borderRadius: 999, border: `1px solid ${COLOR.green}` }}>
              <ArrowUp size={13} color={COLOR.green} />
              <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.green }}>{standing.delta}</span>
            </span>
          )}
        </div>

        <div style={{ fontSize: 19, fontWeight: 700, color: COLOR.ink, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{standing.headline}</div>
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {standing.ladder.map((r) => (
          <Link key={r.teamId} href={`/lag/${r.teamId}`}
            style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], padding: `${SPACE[3]}px ${SPACE[2]}px`, borderRadius: 8, textDecoration: 'none',
              background: r.subject ? 'rgba(245,194,0,0.08)' : 'transparent' }}>
            <span style={{ width: 22, fontSize: 14, fontWeight: 700, color: r.subject ? COLOR.gold : COLOR.ink3 }}>{r.rank}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: TYPE.body, fontWeight: r.subject ? 700 : 600, color: r.subject ? COLOR.ink : COLOR.ink2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortName(r.teamName)}</span>
            <span style={{ width: 40, textAlign: 'right', fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', fontSize: 17, fontWeight: 700, color: r.subject ? COLOR.gold : COLOR.ink }}>{r.points}</span>
          </Link>
        ))}
      </div>

      <Link href={`/divisioner/${standing.divisionId}`} style={{ fontSize: 13, fontWeight: 600, color: COLOR.ink3, textDecoration: 'none' }}>Hela tabellen →</Link>
    </div>
  )
}
