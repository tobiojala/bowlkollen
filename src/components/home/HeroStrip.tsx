'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { shortName } from '@/lib/utils'
import { dark } from '@/lib/colors'
import type { Match } from '@/app/home/types'
import { divColor, shortDiv, countdown, dateLabel, streamStyle } from '@/app/home/helpers'
import { prefetchMatch } from '@/lib/prefetch'

type StripMatch = { kind: 'match'; match: Match }
type StripTav   = {
  kind: 'tavling'; id: string; name: string; sub: string
  dateLabel: string; venue: string; href: string; isPagaende: boolean
}
export type StripItem = StripMatch | StripTav

export default function HeroStrip({ liveItems, upcomingItems, C, isDark, now }: {
  liveItems: StripItem[]; upcomingItems: StripItem[]
  C: typeof dark; isDark: boolean; now: number
}) {
  const qc      = useQueryClient()
  const pending = useRef<Record<string, boolean>>({})
  const fireMatch = useCallback((id: string) => {
    if (pending.current[id]) return
    pending.current[id] = true
    prefetchMatch(qc, id).finally(() => { pending.current[id] = false })
  }, [qc])

  const hasLive = liveItems.length > 0
  const hasUp   = upcomingItems.length > 0
  const [mode, setMode]         = useState<'live' | 'upcoming'>(hasLive ? 'live' : 'upcoming')
  const [activeIdx, setActiveIdx] = useState(0)

  const items   = mode === 'live' ? liveItems : upcomingItems
  const safeIdx = Math.min(activeIdx, Math.max(0, items.length - 1))
  const item    = items[safeIdx]

  const switchMode = (m: 'live' | 'upcoming') => { setMode(m); setActiveIdx(0) }

  if (!item) return null

  return (
    <div style={{ paddingBottom: 4 }}>

      {/* Mode toggle pill */}
      {hasLive && hasUp && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
          {([['live', 'PÅGÅENDE', liveItems.length], ['upcoming', 'KOMMANDE', upcomingItems.length]] as const).map(([m, label, count]) => {
            const isAct = mode === m
            const clr   = m === 'live' ? '#f5c200' : '#5a82b4'
            return (
              <button key={m} onClick={() => switchMode(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', border: 'none',
                  background: isAct
                    ? (isDark ? `rgba(${m === 'live' ? '245,194,0' : '91,130,180'},0.15)` : `rgba(${m === 'live' ? '245,194,0' : '91,130,180'},0.1)`)
                    : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  outline: `1px solid ${isAct ? clr + '66' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                  WebkitTapHighlightColor: 'transparent',
                } as any}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
                  color: isAct ? clr : C.textMuted }}>
                  {label}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700,
                  color: isAct ? clr : C.textMuted,
                  background: isAct ? `rgba(${m === 'live' ? '245,194,0' : '91,130,180'},0.18)` : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                  borderRadius: 8, padding: '1px 6px' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Hero card */}
      <div style={{ padding: '12px 16px 0' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${safeIdx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {item.kind === 'match' ? (() => {
              const m        = item.match
              const isLive   = mode === 'live'
              const dc       = divColor(m.division)
              const hasScore = m.home_score !== null
              const homeWin  = hasScore && m.home_score! > m.away_score!
              const awayWin  = hasScore && m.away_score! > m.home_score!
              const cd       = !hasScore ? countdown(m.date, now) : null
              const time     = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              const dateStr  = m.date.slice(0, 10)
              const GREEN_M  = '#f5c200'
              const streams  = isLive ? (m.streams ?? []) : []
              const isStream = streams.length > 0
              const topClr   = isLive ? GREEN_M : '#5a82b4'
              const bgFrom   = isLive
                ? (isDark ? 'rgba(245,194,0,0.1)' : 'rgba(245,194,0,0.06)')
                : (isDark ? 'rgba(91,130,180,0.1)' : 'rgba(91,130,180,0.06)')
              const edgeClr  = isLive
                ? (isDark ? 'rgba(245,194,0,0.3)' : 'rgba(245,194,0,0.35)')
                : (isDark ? 'rgba(91,130,180,0.25)' : 'rgba(91,130,180,0.3)')
              return (
                <a href={'/matches/' + m.id}
                  onMouseEnter={() => fireMatch(m.id)} onTouchStart={() => fireMatch(m.id)}
                  style={{
                    display: 'block', borderRadius: 16, textDecoration: 'none', overflow: 'hidden',
                    background: isDark
                      ? `linear-gradient(145deg,${bgFrom} 0%,rgba(11,21,40,0.98) 100%)`
                      : `linear-gradient(145deg,${bgFrom} 0%,rgba(248,248,252,1) 100%)`,
                    border: `1px solid ${edgeClr}`,
                    WebkitTapHighlightColor: 'transparent',
                  } as any}>
                  <div style={{ height: 3, background: `linear-gradient(90deg,${topClr},${topClr}40)` }} />
                  <div style={{ padding: '14px 16px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      {isLive ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN_M, boxShadow: `0 0 6px ${GREEN_M}` }} />
                            <span style={{ fontSize: 10, fontWeight: 800, color: GREEN_M, letterSpacing: 1.5 }}>PÅGÅENDE</span>
                          </div>
                          {isStream && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <motion.div
                                animate={{ opacity: [1, 0.2, 1], boxShadow: ['0 0 3px #e05555', '0 0 9px #e05555', '0 0 3px #e05555'] }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: '#e05555' }}
                              />
                              <span style={{ fontSize: 9, fontWeight: 800, color: '#e05555', letterSpacing: 1.2 }}>LIVE</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#5a82b4', letterSpacing: 1.5 }}>KOMMANDE</span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: dc,
                        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                        padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3 }}>
                        {shortDiv(m.division)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: hasScore ? (homeWin ? C.text : C.textMuted) : C.text }}>
                          {shortName(m.home?.name || '')}
                        </div>
                        <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>Hemma</div>
                      </div>

                      <div style={{ flexShrink: 0, width: 88, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {hasScore ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: homeWin ? C.accent : C.textMuted }}>{m.home_score}</span>
                            <span style={{ fontSize: 22, color: C.textMuted, fontWeight: 200, marginTop: -2 }}>–</span>
                            <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: awayWin ? C.accent : C.textMuted }}>{m.away_score}</span>
                          </div>
                        ) : cd ? (
                          <>
                            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: C.accent, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>{cd}</div>
                            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 1.5 }}>
                              {dateLabel(dateStr)}<br />{time}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, textAlign: 'center' }}>{time || 'vs'}</div>
                            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, textAlign: 'center' }}>{dateLabel(dateStr)}</div>
                          </>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: hasScore ? (awayWin ? C.text : C.textMuted) : C.text }}>
                          {shortName(m.away?.name || '')}
                        </div>
                        <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>Borta</div>
                      </div>
                    </div>

                    {isStream ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 14 }}>
                        {streams.map((s, idx) => {
                          const ss = streamStyle(s.url)
                          return (
                            <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: 10, fontWeight: 700, color: ss.color,
                                background: ss.bg, border: `1px solid ${ss.border}`,
                                borderRadius: 8, padding: '5px 10px', textDecoration: 'none',
                                display: 'flex', alignItems: 'center', gap: 5,
                                WebkitTapHighlightColor: 'transparent' } as any}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color, flexShrink: 0, display: 'inline-block' }} />
                              {ss.label}
                            </a>
                          )
                        })}
                      </div>
                    ) : isLive ? (
                      <div style={{ marginTop: 14, textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, color: `rgba(245,194,0,0.6)` }}>Tryck för detaljer →</span>
                      </div>
                    ) : null}
                  </div>
                </a>
              )
            })() : (
              // Tävling hero — always gold
              <a href={item.href} style={{
                display: 'block', borderRadius: 16, textDecoration: 'none', overflow: 'hidden',
                background: isDark
                  ? 'linear-gradient(145deg,rgba(245,194,0,0.1) 0%,rgba(11,21,40,0.98) 100%)'
                  : 'linear-gradient(145deg,rgba(245,194,0,0.07) 0%,rgba(248,248,252,1) 100%)',
                border: `1px solid ${isDark ? 'rgba(245,194,0,0.25)' : 'rgba(245,194,0,0.32)'}`,
                WebkitTapHighlightColor: 'transparent',
              } as any}>
                <div style={{ height: 3, background: 'linear-gradient(90deg,#f5c200,rgba(245,194,0,0.2))' }} />
                <div style={{ padding: '14px 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 14, color: '#f5c200', lineHeight: 1 }}>◆</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>
                      {item.isPagaende ? 'TÄVLING PÅGÅR' : 'KOMMANDE TÄVLING'}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 6 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{item.sub}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 16 }}>{item.dateLabel} · {item.venue}</div>
                  <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#1a1400',
                    background: '#f5c200', borderRadius: 8, padding: '6px 16px' }}>
                    {item.isPagaende ? 'Se tävlingen →' : 'Mer info →'}
                  </div>
                </div>
              </a>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Compact strip */}
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', padding: '10px 16px 6px' } as any}>
          {items.map((it, i) => {
            const isAct = i === safeIdx
            if (it.kind === 'match') {
              const m         = it.match
              const dc        = divColor(m.division)
              const hasScore  = m.home_score !== null
              const homeWin   = hasScore && m.home_score! > m.away_score!
              const awayWin   = hasScore && m.away_score! > m.home_score!
              const isLiveM   = m.status === 'live'
              const isStreamM = isLiveM && (m.streams?.length ?? 0) > 0
              const GREEN_S   = '#f5c200'
              const cd        = !hasScore ? countdown(m.date, now) : null
              const time      = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              return (
                <button key={m.id} onClick={() => setActiveIdx(i)}
                  style={{
                    flexShrink: 0, width: 82, padding: '8px 6px',
                    borderRadius: 12, cursor: 'pointer',
                    border: `1px solid ${isAct
                      ? (isLiveM ? 'rgba(245,194,0,0.55)' : 'rgba(91,130,180,0.55)')
                      : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)')}`,
                    background: isAct
                      ? (isLiveM
                        ? (isDark ? 'rgba(245,194,0,0.14)' : 'rgba(245,194,0,0.08)')
                        : (isDark ? 'rgba(91,130,180,0.14)' : 'rgba(91,130,180,0.08)'))
                      : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    WebkitTapHighlightColor: 'transparent', overflow: 'hidden', position: 'relative',
                  } as any}>
                  {isStreamM ? (
                    <motion.div
                      animate={{ opacity: [1, 0.25, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ fontSize: 8, fontWeight: 800, color: '#e05555', letterSpacing: 0.5, marginTop: 2 }}>
                      ● LIVE
                    </motion.div>
                  ) : (
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: isLiveM ? GREEN_S : dc, letterSpacing: 0.2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 72, marginTop: 2 }}>
                      {shortDiv(m.division)}
                    </div>
                  )}
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: homeWin ? C.text : C.textMuted,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>
                    {shortName(m.home?.name || '')}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    color: isLiveM ? GREEN_S : C.accent }}>
                    {hasScore ? `${m.home_score}–${m.away_score}` : (cd || time || 'vs')}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: awayWin ? C.text : C.textMuted,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>
                    {shortName(m.away?.name || '')}
                  </div>
                </button>
              )
            }
            // Tävling strip card
            return (
              <button key={it.id} onClick={() => setActiveIdx(i)}
                style={{
                  flexShrink: 0, width: 82, padding: '8px 6px',
                  borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${isAct ? 'rgba(245,194,0,0.55)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)')}`,
                  background: isAct
                    ? (isDark ? 'rgba(245,194,0,0.14)' : 'rgba(245,194,0,0.08)')
                    : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  WebkitTapHighlightColor: 'transparent', overflow: 'hidden', position: 'relative',
                } as any}>
                <span style={{ fontSize: 15, color: '#f5c200', lineHeight: 1 }}>◆</span>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#f5c200', textAlign: 'center',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>
                  {it.name}
                </div>
                <div style={{ fontSize: 8, color: C.textMuted }}>{it.dateLabel}</div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
