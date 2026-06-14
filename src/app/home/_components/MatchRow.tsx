'use client'

import Link from 'next/link'
import { shortName } from '@/lib/utils'
import type { Match } from '@/app/home/types'
import { countdown, divColor, shortDiv } from '@/app/home/helpers'
import { HC } from './tokens'

/** A compact match row for results (completed) and upcoming fixtures. */
export default function MatchRow({ m, variant, now }: {
  m: Match
  variant: 'recent' | 'upcoming'
  now: number
}) {
  const hs = m.home_score, as = m.away_score
  const homeWon = hs != null && as != null && hs > as
  const awayWon = hs != null && as != null && as > hs
  const time = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  const cd   = variant === 'upcoming' && now ? countdown(m.date, now) : null

  const teamColor = (won: boolean, lost: boolean) => won ? HC.INK : lost ? HC.INK3 : HC.INK2

  return (
    <Link href={`/matches/${m.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        background: HC.SURFACE, borderRadius: 14, marginBottom: 6 }}>

        {/* Division pill */}
        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, color: divColor(m.division),
          padding: '3px 8px', borderRadius: 999, background: 'rgba(244,245,247,0.06)' }}>
          {shortDiv(m.division)}
        </span>

        {/* Teams */}
        <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
          <div style={{ fontWeight: 600, color: teamColor(homeWon, awayWon),
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(m.home?.name ?? '')}</div>
          <div style={{ fontWeight: 600, color: teamColor(awayWon, homeWon), marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(m.away?.name ?? '')}</div>
        </div>

        {/* Score (recent, stable) or time/countdown (upcoming). Time is clock/
            locale/relative-data dependent, so render it only after mount to keep
            the SSR and first client render identical. */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {variant === 'recent' && hs != null && as != null ? (
            <div style={{ fontVariantNumeric: 'tabular-nums' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: homeWon ? HC.GREEN : HC.INK2, lineHeight: 1.3 }}>{hs}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: awayWon ? HC.GREEN : HC.INK2, lineHeight: 1.3 }}>{as}</div>
            </div>
          ) : now ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: HC.INK, fontVariantNumeric: 'tabular-nums' }}>
                {cd ?? time}
              </div>
              {cd && <div style={{ fontSize: 10, color: HC.INK4, marginTop: 2 }}>{time}</div>}
            </>
          ) : (
            <div style={{ fontSize: 14, color: HC.INK4 }}>·</div>
          )}
        </div>
      </div>
    </Link>
  )
}
