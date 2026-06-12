'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useColors } from '@/components/ThemeProvider'
import { useQueryClient } from '@tanstack/react-query'
import { shortName } from '@/lib/utils'
import { divColor, shortDiv, countdown, dateLabel, streamStyle } from '@/app/home/helpers'
import { prefetchMatch } from '@/lib/prefetch'
import type { Match } from '@/app/home/types'

function teamHue(name: string) {
  return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
}

function TeamAvatar({ name, size }: { name: string; size: number }) {
  const { isDark } = useColors()
  const hue = teamHue(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: isDark ? `hsl(${hue},40%,13%)` : `hsl(${hue},40%,91%)`,
      border: `2px solid hsl(${hue},55%,52%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 900,
      color: `hsl(${hue},55%,${isDark ? 62 : 38}%)`,
      letterSpacing: -1, flexShrink: 0,
    }}>
      {name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  )
}

export default function LiveHero({ matches, now }: { matches: Match[]; now: number }) {
  const { C, isDark } = useColors()
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const qc = useQueryClient()
  const pending = useRef<Record<string, boolean>>({})

  const prefetch = useCallback((id: string) => {
    if (pending.current[id]) return
    pending.current[id] = true
    prefetchMatch(qc, id).finally(() => { pending.current[id] = false })
  }, [qc])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !el.firstElementChild) return
    const cardWidth = (el.firstElementChild as HTMLElement).offsetWidth
    setActiveIdx(Math.min(Math.round(el.scrollLeft / (cardWidth + 12)), matches.length - 1))
  }, [matches.length])

  if (!matches.length) return null

  const hasLive = matches.some(m => m.status === 'live')
  const accentClr = hasLive ? '#f5c200' : '#5a82b4'

  return (
    <section style={{ paddingTop: 16 }}>
      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasLive && (
          <motion.div
            animate={{ opacity: [1, 0.25, 1], scale: [1, 1.25, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5c200',
              boxShadow: '0 0 10px rgba(245,194,0,0.8)', flexShrink: 0 }}
          />
        )}
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: accentClr }}>
          {hasLive ? 'PÅGÅENDE' : 'KOMMANDE'}
        </span>
        {matches.length > 1 && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: C.muted }}>
            {activeIdx + 1} / {matches.length}
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex', gap: 12,
          overflowX: 'auto', scrollbarWidth: 'none',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          padding: '0 20px 20px',
        } as React.CSSProperties}
      >
        {matches.map((m) => {
          const isLive = m.status === 'live'
          const hasScore = m.home_score !== null
          const homeWin = hasScore && m.home_score! > m.away_score!
          const awayWin = hasScore && m.away_score! > m.home_score!
          const cd = !hasScore ? countdown(m.date, now) : null
          const time = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
          const dc = divColor(m.division)
          const streams = m.streams ?? []

          return (
            <div
              key={m.id}
              onMouseEnter={() => prefetch(m.id)}
              onClick={() => router.push(`/matches/${m.id}`)}
              style={{
                flex: '0 0 calc(100% - 4px)',
                scrollSnapAlign: 'start',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                background: isDark
                  ? 'linear-gradient(160deg,rgba(18,28,48,1) 0%,rgba(8,14,26,1) 100%)'
                  : 'linear-gradient(160deg,rgba(242,246,255,1) 0%,rgba(255,255,255,1) 100%)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.55)' : '0 4px 24px rgba(0,0,0,0.07)',
              } as React.CSSProperties}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg,${isLive ? '#f5c200' : dc},transparent)` }} />
              <div style={{ padding: '20px 20px 22px' }}>

                {/* Status row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {isLive && (
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5c200', flexShrink: 0 }}
                      />
                    )}
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                      color: isLive ? '#f5c200' : '#5a82b4' }}>
                      {isLive
                        ? `PÅGÅENDE${m.gameNumber ? ` · Spel ${m.gameNumber}/${m.totalGames}` : ''}`
                        : 'KOMMANDE'}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: dc,
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    padding: '3px 9px', borderRadius: 6, letterSpacing: 0.3 }}>
                    {shortDiv(m.division)}
                  </span>
                </div>

                {/* Teams & score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                    <TeamAvatar name={m.home?.name || ''} size={48} />
                    <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.15, textAlign: 'right',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
                      color: hasScore ? (homeWin ? C.text : C.muted) : C.text }}>
                      {shortName(m.home?.name || '')}
                    </div>
                    <span style={{ fontSize: 9, letterSpacing: 1.2, color: C.muted }}>HEMMA</span>
                  </div>

                  <div style={{ flexShrink: 0, width: 88, textAlign: 'center' }}>
                    {hasScore ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
                        <span className="num" style={{ fontSize: 46, fontWeight: 900, lineHeight: 1,
                          color: homeWin ? '#fff' : C.muted,
                          textShadow: (homeWin && isDark) ? '0 0 24px rgba(255,255,255,0.4)' : 'none' }}>
                          {m.home_score}
                        </span>
                        <span style={{ fontSize: 22, color: C.muted, fontWeight: 300, marginBottom: 4 }}>–</span>
                        <span className="num" style={{ fontSize: 46, fontWeight: 900, lineHeight: 1,
                          color: awayWin ? '#fff' : C.muted,
                          textShadow: (awayWin && isDark) ? '0 0 24px rgba(255,255,255,0.4)' : 'none' }}>
                          {m.away_score}
                        </span>
                      </div>
                    ) : cd ? (
                      <>
                        <div suppressHydrationWarning className="num" style={{ fontSize: 30, fontWeight: 900, color: C.accent,
                          fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{cd}</div>
                        <div style={{ fontSize: 9, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
                          {dateLabel(m.date.slice(0, 10))}<br />{time}
                        </div>
                      </>
                    ) : (
                      <div className="num" style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{time || 'vs'}</div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                    <TeamAvatar name={m.away?.name || ''} size={48} />
                    <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.15,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
                      color: hasScore ? (awayWin ? C.text : C.muted) : C.text }}>
                      {shortName(m.away?.name || '')}
                    </div>
                    <span style={{ fontSize: 9, letterSpacing: 1.2, color: C.muted }}>BORTA</span>
                  </div>
                </div>

                {/* Live: series breakdown */}
                {isLive && m.individualGames && m.individualGames.home.length > 0 && (
                  <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {m.individualGames.home.map((h, gi) => {
                      const a = m.individualGames!.away[gi] ?? 0
                      return (
                        <div key={gi} style={{ textAlign: 'center', minWidth: 46,
                          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                          borderRadius: 10, padding: '8px 4px' }}>
                          <div style={{ fontSize: 9, color: C.muted, marginBottom: 5, letterSpacing: 0.5 }}>S{gi + 1}</div>
                          <div className="num" style={{ fontSize: 16, fontWeight: 800, color: h > a ? '#f5c200' : C.muted }}>{h}</div>
                          <div style={{ fontSize: 9, color: C.muted, margin: '2px 0' }}>–</div>
                          <div className="num" style={{ fontSize: 16, fontWeight: 800, color: a > h ? '#f5c200' : C.muted }}>{a}</div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* High series spotlight */}
                {isLive && m.highSeries && m.highSeries.length > 0 && (
                  <div style={{ marginTop: 14, padding: '9px 14px', borderRadius: 12,
                    background: isDark ? 'rgba(245,194,0,0.07)' : 'rgba(245,194,0,0.06)',
                    border: '1px solid rgba(245,194,0,0.2)',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>⭐</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f5c200' }}>
                      {m.highSeries[0].playerName}
                    </span>
                    <span style={{ fontSize: 13, color: C.muted }}>· {m.highSeries[0].score} i detta spel</span>
                  </div>
                )}

                {/* Stream links */}
                {streams.length > 0 && (
                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {streams.map((s, i) => {
                      const ss = streamStyle(s.url)
                      return (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 11, fontWeight: 700, color: ss.color,
                            background: ss.bg, border: `1px solid ${ss.border}`,
                            borderRadius: 8, padding: '7px 14px', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 6,
                            WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color, display: 'inline-block' }} />
                          {ss.label}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress dots */}
      {matches.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingBottom: 6 }}>
          {matches.map((_, i) => (
            <div key={i} style={{
              height: 5, borderRadius: 3,
              transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              width: i === activeIdx ? 22 : 5,
              background: i === activeIdx ? accentClr : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
            }} />
          ))}
        </div>
      )}
    </section>
  )
}
