'use client'

import Link from 'next/link'
import { shortName } from '@/lib/utils'
import type { Match } from '@/app/home/types'
import { countdown, divColor, shortDiv } from '@/app/home/helpers'
import { calcMatchpoang } from '@/lib/scoring'
import { HC } from './tokens'

export default function MatchRow({ m, variant, now }: {
  m: Match
  variant: 'recent' | 'upcoming'
  now: number
}) {
  const hs = m.home_score, as = m.away_score
  const homeWon = hs != null && as != null && hs > as
  const awayWon = hs != null && as != null && as > hs
  const [homeMp, awayMp] = (hs != null && as != null) ? calcMatchpoang(hs, as) : [null, null]

  const time    = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date(m.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
  const cd      = variant === 'upcoming' && now ? countdown(m.date, now) : null

  return (
    <Link href={`/matches/${m.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{ background: HC.SURFACE, borderRadius: 18, overflow: 'hidden', padding: '14px 16px' }}>

        {/* Top row: division pill + optional round + meta (date or countdown) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: divColor(m.division),
            padding: '3px 8px', borderRadius: 999, background: 'rgba(244,245,247,0.06)',
            flexShrink: 0,
          }}>
            {shortDiv(m.division)}
          </span>
          {m.round && (
            <span style={{ fontSize: 10, color: HC.INK4, flexShrink: 0 }}>Omg {m.round}</span>
          )}
          <span style={{ flex: 1 }} />
          {variant === 'recent' ? (
            <span style={{ fontSize: 10, color: HC.INK4 }}>{dateStr}</span>
          ) : now ? (
            <span style={{ fontSize: 10, fontWeight: cd ? 700 : 400, color: cd ? HC.INK3 : HC.INK4, fontVariantNumeric: 'tabular-nums' }}>
              {cd ?? time}
            </span>
          ) : null}
        </div>

        {/* Centre row: home — score/vs — away */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <span style={{
              fontSize: 15, fontWeight: homeWon ? 700 : 500,
              color: homeWon ? HC.INK : HC.INK3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
            }}>
              {shortName(m.home?.name ?? '')}
            </span>
          </div>

          <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 76 }}>
            {variant === 'recent' && hs != null && as != null ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5, fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: homeWon ? HC.GREEN : HC.INK2 }}>{hs}</span>
                  <span style={{ fontSize: 14, color: HC.INK4 }}>–</span>
                  <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: awayWon ? HC.GREEN : HC.INK2 }}>{as}</span>
                </div>
                {homeMp !== null && (
                  <div style={{ fontSize: 10, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: homeWon ? HC.GREEN : HC.INK4 }}>{homeMp}</span>
                    <span style={{ color: HC.INK4, margin: '0 2px' }}>–</span>
                    <span style={{ color: awayWon ? HC.GREEN : HC.INK4 }}>{awayMp}</span>
                    <span style={{ color: HC.INK4, marginLeft: 3 }}>MP</span>
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 300, color: HC.INK4, letterSpacing: 3 }}>vs</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: 15, fontWeight: awayWon ? 700 : 500,
              color: awayWon ? HC.INK : HC.INK3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
            }}>
              {shortName(m.away?.name ?? '')}
            </span>
          </div>
        </div>

        {/* Upcoming bottom strip: full date + optional venue */}
        {variant === 'upcoming' && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${HC.HAIRLINE}`, fontSize: 11, color: HC.INK4, textAlign: 'center', textTransform: 'capitalize' }}>
            {dateStr}{now ? ` · ${time}` : ''}{m.venue ? ` · ${m.venue}` : ''}
          </div>
        )}
      </div>
    </Link>
  )
}
