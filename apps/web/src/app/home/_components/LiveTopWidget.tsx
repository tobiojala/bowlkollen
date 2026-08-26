'use client'

import Link from 'next/link'
import { COLOR, RADIUS, SPACE, TYPE, FONT } from '@/lib/brand'
import { shortDiv } from '@/app/home/helpers'
import type { Match, BitsTopScore } from '@/lib/types'

// Desktop-sidebar pulse card: matches live right now (when any), then the
// league's standout series. Replaces the old Utforska nav-shortcut list — this
// space earns its keep by showing what's happening, not by duplicating the nav.
export function LiveTopWidget({ live, topScores }: { live: Match[]; topScores: BitsTopScore[] }) {
  const liveTop = live.slice(0, 3)
  const series  = topScores.slice(0, 5)
  if (liveTop.length === 0 && series.length === 0) return null

  const label: React.CSSProperties = {
    fontSize: TYPE.label, fontWeight: 700, color: COLOR.ink3,
    letterSpacing: '0.12em', padding: '14px 16px 8px',
    display: 'flex', alignItems: 'center', gap: 7,
  }
  const num: React.CSSProperties = {
    fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
  }

  return (
    <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, overflow: 'hidden' }}>

      {liveTop.length > 0 && (
        <section>
          <div style={label}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR.gold, boxShadow: `0 0 8px ${COLOR.gold}` }} />
            LIVE NU
          </div>
          {liveTop.map((m) => {
            const hs = m.home_score ?? 0, as = m.away_score ?? 0
            const homeLead = hs > as, awayLead = as > hs
            return (
              <Link key={m.id} href={`/matches/${m.id}`}
                style={{ display: 'block', padding: '10px 16px', textDecoration: 'none', borderTop: `1px solid ${COLOR.hairline}` }}>
                {([[m.home.name, hs, homeLead], [m.away.name, as, awayLead]] as [string, number, boolean][]).map(([name, sc, lead], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: i ? 3 : 0 }}>
                    <span style={{ fontSize: 15, fontWeight: lead ? 700 : 500, color: lead ? COLOR.ink : COLOR.ink2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                    <span style={{ ...num, fontSize: 16, fontWeight: 700, color: lead ? COLOR.ink : COLOR.ink2 }}>{sc}</span>
                  </div>
                ))}
              </Link>
            )
          })}
        </section>
      )}

      {series.length > 0 && (
        <section>
          <div style={label}>TOPPSERIER</div>
          {series.map((s, i) => {
            const row = (
              <>
                <span style={{ ...num, fontSize: 17, fontWeight: 800, color: i === 0 ? COLOR.gold : COLOR.ink, width: 40, flexShrink: 0 }}>{s.total}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.playerName}</div>
                  <div style={{ fontSize: 13, color: COLOR.ink3 }}>{shortDiv(s.division)}</div>
                </div>
              </>
            )
            const style: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: `1px solid ${COLOR.hairline}`, textDecoration: 'none' }
            return s.publicId
              ? <Link key={`${s.matchId}-${i}`} href={`/players/${s.publicId}`} style={style}>{row}</Link>
              : <div key={`${s.matchId}-${i}`} style={style}>{row}</div>
          })}
        </section>
      )}
    </div>
  )
}
