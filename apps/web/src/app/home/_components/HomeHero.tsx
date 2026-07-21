'use client'

import { shortName } from '@/lib/utils'
import type { Match } from '@/app/home/types'
import { countdown } from '@/app/home/helpers'
import { HC } from './tokens'

function timeGreeting(hour: number): string {
  if (hour < 5)  return 'Sent uppe'
  if (hour < 12) return 'God morgon'
  if (hour < 18) return 'Hej'
  return 'God kväll'
}

interface HomeHeroProps {
  now: number
  userName?: string | null
  dayLine: string
  liveCount: number
  nextMatch?: Match | null
  onTapLive: () => void
}

/**
 * The first impression — greeting + one hero number.
 * Live matches take priority; otherwise the next-match countdown.
 */
export default function HomeHero({ now, userName, dayLine, liveCount, nextMatch, onTapLive }: HomeHeroProps) {
  const greeting = now ? timeGreeting(new Date(now).getHours()) : 'Hej'
  const cd       = nextMatch && now ? countdown(nextMatch.date, now) : null

  return (
    <section style={{ padding: '28px 24px 8px' }}>
      {/* Greeting */}
      <div style={{ fontSize: 14, color: HC.INK3, fontWeight: 500 }}>{greeting}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: HC.INK, lineHeight: 1.2, marginTop: 2, letterSpacing: -0.4 }}>
        {userName || dayLine}
      </div>
      {userName && <div style={{ fontSize: 13, color: HC.INK3, marginTop: 3 }}>{dayLine}</div>}

      {/* Hero number */}
      <div style={{ marginTop: 28, marginBottom: 12 }}>
        {liveCount > 0 ? (
          <button onClick={onTapLive} className="hero-in"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
              WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="live-dot" style={{ width: 11, height: 11, borderRadius: '50%', background: HC.GOLD, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: HC.GOLD }}>LIVE NU</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontSize: 76, fontWeight: 900, color: HC.INK, lineHeight: 1, letterSpacing: -2, fontVariantNumeric: 'tabular-nums' }}>{liveCount}</span>
              <span style={{ fontSize: 15, color: HC.INK2, fontWeight: 500 }}>
                {liveCount === 1 ? 'match' : 'matcher'} live just nu
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: HC.GOLD, letterSpacing: '0.06em', marginTop: 14 }}>SE MATCHER ↓</div>
          </button>
        ) : nextMatch ? (
          <div className="hero-in">
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: HC.INK3, marginBottom: 8 }}>NÄSTA MATCH OM</div>
            <div suppressHydrationWarning style={{ fontSize: cd && cd.length <= 5 ? 64 : 48, fontWeight: 900, color: HC.INK, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
              {now ? (cd ?? 'Nu!') : '—'}
            </div>
            <div style={{ fontSize: 14, color: HC.INK2, marginTop: 14 }}>
              {shortName(nextMatch.home?.name ?? '')}
              <span style={{ margin: '0 9px', color: HC.INK4 }}>–</span>
              {shortName(nextMatch.away?.name ?? '')}
            </div>
          </div>
        ) : (
          <div className="hero-in" style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: HC.INK }}>Välkommen till Bowlkollen</div>
            <div style={{ fontSize: 14, color: HC.INK3, marginTop: 6 }}>Live bowling — svenska ligan</div>
          </div>
        )}
      </div>
    </section>
  )
}
