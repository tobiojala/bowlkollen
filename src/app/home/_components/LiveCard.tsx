'use client'

import Link from 'next/link'
import { shortName } from '@/lib/utils'
import type { Match } from '@/app/home/types'
import { divColor, shortDiv, streamStyle } from '@/app/home/helpers'
import { HC } from './tokens'
import Reveal from '@/components/Reveal'

/** A live match — score is the hero; the leading team is highlighted. */
export default function LiveCard({ m }: { m: Match }) {
  const hs = m.home_score ?? 0, as = m.away_score ?? 0
  const homeLead = hs > as, awayLead = as > hs
  const streams = m.streams ?? []

  return (
    <Reveal direction="scale" distance={0}>
    <div style={{ background: HC.SURFACE, borderRadius: 18, overflow: 'hidden' }}>
      <Link href={`/matches/${m.id}`}
        style={{ display: 'block', textDecoration: 'none', padding: streams.length > 0 ? '14px 16px 12px' : '14px 16px 16px' }}>
        {/* Header: division + live status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: divColor(m.division),
            padding: '3px 9px', borderRadius: 999, background: 'rgba(244,245,247,0.06)' }}>
            {shortDiv(m.division)}
          </span>
          <span style={{ flex: 1 }} />
          <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: HC.GOLD }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: HC.GOLD, letterSpacing: '0.08em' }}>
            {m.gameNumber && m.totalGames ? `SPEL ${m.gameNumber}/${m.totalGames}` : 'LIVE'}
          </span>
        </div>

        {/* Teams + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: homeLead ? HC.INK : HC.INK2, letterSpacing: -0.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(m.home?.name ?? '')}</div>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: homeLead ? HC.GOLD : HC.INK }}>{hs}</span>
            <span style={{ fontSize: 16, color: HC.INK4 }}>–</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: awayLead ? HC.GOLD : HC.INK }}>{as}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: awayLead ? HC.INK : HC.INK2, letterSpacing: -0.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(m.away?.name ?? '')}</div>
          </div>
        </div>
      </Link>

      {/* Stream pills — siblings of the link, never nested inside it */}
      {streams.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 16px 16px', justifyContent: 'center' }}>
          {streams.map((s, i) => {
            const ss = streamStyle(s.url)
            return (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, fontWeight: 600, color: ss.color, background: ss.bg, borderRadius: 999,
                  padding: '6px 11px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color }} />
                {ss.label.replace('▶ ', '')}
              </a>
            )
          })}
        </div>
      )}
    </div>
    </Reveal>
  )
}
