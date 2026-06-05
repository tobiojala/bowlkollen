'use client'

import { motion } from 'framer-motion'
import { dark } from '@/lib/colors'
import { shortName } from '@/lib/utils'
import type { Match } from '@/app/home/types'
import { tensionScore, tensionInsight, tensionColor, divColor, shortDiv, streamStyle } from '@/app/home/helpers'

export default function MatchPulsen({ filteredLive, followedIds, C, isDark }: {
  filteredLive: Match[]
  followedIds: Set<string>
  C: typeof dark
  isDark: boolean
}) {
  if (filteredLive.length === 0) return null

  const sorted   = [...filteredLive].sort((a, b) => tensionScore(b) - tensionScore(a))
  const hot      = sorted[0]
  const score    = tensionScore(hot)
  const h        = hot.home_score!, a = hot.away_score!
  const isTied   = h === a
  const isFollowed = followedIds.has(hot.home.id) || followedIds.has(hot.away.id)
  const needleClr  = tensionColor(score, C.textMuted)
  const streams    = hot.streams ?? []
  const insight    = tensionInsight(hot)

  // SVG gauge geometry
  const cx = 50, cy = 60, r = 44, sw = 9
  const arcLen     = Math.PI * r
  const dashOffset = arcLen * (1 - score)
  const z65a = Math.PI * (1 - 0.65)
  const z65x = cx + r * Math.cos(z65a), z65y = cy - r * Math.sin(z65a)
  const needleLen = 32
  const needleDeg = -(score * 180)

  const borderClr = isFollowed
    ? 'rgba(245,194,0,0.5)'
    : isTied ? 'rgba(245,194,0,0.35)'
    : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${borderClr}`,
        boxShadow: isFollowed ? '0 0 0 3px rgba(245,194,0,0.12), 0 0 28px rgba(245,194,0,0.1)' : undefined,
        background: isTied
          ? (isDark ? 'linear-gradient(145deg,rgba(245,194,0,0.08) 0%,rgba(11,21,40,0.98) 100%)' : 'linear-gradient(145deg,rgba(245,194,0,0.04) 0%,rgba(248,248,252,1) 100%)')
          : (isDark ? 'linear-gradient(145deg,rgba(255,255,255,0.03) 0%,rgba(11,21,40,0.98) 100%)' : 'linear-gradient(145deg,rgba(0,0,0,0.02) 0%,rgba(248,248,252,1) 100%)') }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${needleClr},${needleClr}30)` }} />
        <div style={{ padding: '12px 16px 16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: needleClr, letterSpacing: 1.4, flex: 1 }}>MATCHPULSEN</span>
            {isFollowed && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#f5c200',
                background: 'rgba(245,194,0,0.12)', border: '1px solid rgba(245,194,0,0.3)',
                padding: '2px 7px', borderRadius: 4, letterSpacing: 0.3 }}>DITT LAG</span>
            )}
            <span style={{ fontSize: 9, fontWeight: 700, color: divColor(hot.division),
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              padding: '3px 8px', borderRadius: 4, letterSpacing: 0.3 }}>{shortDiv(hot.division)}</span>
          </div>

          {/* 3-col: home | gauge | away */}
          <a href={'/matches/' + hot.id} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', WebkitTapHighlightColor: 'transparent' } as any}>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2, letterSpacing: 0.5 }}>HEMMA</div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                color: h > a ? C.text : isTied ? C.text : C.textMuted }}>{h}</div>
              <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, marginTop: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: h > a ? C.text : isTied ? C.text : C.textMuted }}>
                {shortName(hot.home?.name || '')}
              </div>
            </div>

            {/* Gauge */}
            <div style={{ flexShrink: 0, width: 100 }}>
              <svg viewBox="0 0 100 66" style={{ width: '100%', display: 'block' }}>
                <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
                  fill="none" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                  strokeWidth={sw} strokeLinecap="butt" />
                <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${z65x} ${z65y}`}
                  fill="none" stroke="rgba(56,160,136,0.2)" strokeWidth={sw} strokeLinecap="butt" />
                <path d={`M ${z65x} ${z65y} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
                  fill="none" stroke="rgba(245,194,0,0.2)" strokeWidth={sw} strokeLinecap="butt" />
                <motion.path
                  d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
                  fill="none" stroke={needleClr} strokeWidth={sw} strokeLinecap="round"
                  strokeDasharray={arcLen}
                  initial={{ strokeDashoffset: arcLen }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                  style={isTied ? { filter: `drop-shadow(0 0 4px ${needleClr})` } : {}}
                />
                {[0.25, 0.5, 0.75].map(t => {
                  const ta = Math.PI * (1 - t)
                  const x1 = cx + (r - sw/2 - 1) * Math.cos(ta)
                  const y1 = cy - (r - sw/2 - 1) * Math.sin(ta)
                  const x2 = cx + (r + sw/2 + 1) * Math.cos(ta)
                  const y2 = cy - (r + sw/2 + 1) * Math.sin(ta)
                  return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.16)'} strokeWidth={1} />
                })}
                <motion.g
                  initial={{ rotate: 0 }}
                  animate={{ rotate: needleDeg }}
                  transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}>
                  <line x1={cx} y1={cy} x2={cx - needleLen} y2={cy}
                    stroke={needleClr} strokeWidth={2} strokeLinecap="round" />
                </motion.g>
                <circle cx={cx} cy={cy} r={4} fill={needleClr} />
                <circle cx={cx} cy={cy} r={2} fill={isDark ? '#10161e' : '#f5f2ec'} />
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2, letterSpacing: 0.5 }}>BORTA</div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                color: a > h ? C.text : isTied ? C.text : C.textMuted }}>{a}</div>
              <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, marginTop: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: a > h ? C.text : isTied ? C.text : C.textMuted }}>
                {shortName(hot.away?.name || '')}
              </div>
            </div>
          </a>

          {/* Insight */}
          {insight && (
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, fontWeight: 700,
              color: needleClr, letterSpacing: 0.4 }}>
              {insight}
            </div>
          )}

          {/* Stream pills */}
          {streams.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 10 }}>
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
          )}

          {/* Heat list — other live matches */}
          {sorted.length > 1 && (
            <div style={{ marginTop: 12, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, paddingTop: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: C.textMuted, letterSpacing: 1.4, marginBottom: 6 }}>
                ALLA LIVE
              </div>
              {sorted.slice(1).map((m, idx) => {
                const ms   = tensionScore(m)
                const dotClr = tensionColor(ms, C.textMuted)
                const mh   = m.home_score!, ma = m.away_score!
                const isLast = idx === sorted.length - 2
                return (
                  <a key={m.id} href={'/matches/' + m.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 0', textDecoration: 'none',
                      borderBottom: isLast ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                      WebkitTapHighlightColor: 'transparent' } as any}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotClr, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.text,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortName(m.home.name)} – {shortName(m.away.name)}
                      </div>
                      <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>{shortDiv(m.division)}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                      color: mh === ma ? '#f5c200' : C.text, flexShrink: 0 }}>
                      {mh}–{ma}
                    </div>
                    <div style={{ width: 28, height: 3, borderRadius: 2, flexShrink: 0,
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${ms * 100}%`, background: dotClr, borderRadius: 2 }} />
                    </div>
                  </a>
                )
              })}
            </div>
          )}

          {/* Link to full /puls page */}
          <div style={{ marginTop: 12, paddingTop: 12,
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
            textAlign: 'center' }}>
            <a href="/puls" style={{ fontSize: 9, fontWeight: 800, color: needleClr,
              textDecoration: 'none', letterSpacing: 1.0 }}>
              SE MATCHPULSEN →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
