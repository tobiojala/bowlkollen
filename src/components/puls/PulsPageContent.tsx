'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { shortName, shortDiv } from '@/lib/utils'
import {
  PULS_BASELINE,
  PULS_DEMO,
  PULS_MOCK_LIVE,
  PULS_STYLES,
  pulsDivColor,
  pulsStreamStyle,
  tensionColor,
  tensionInsight,
  tensionScore,
  type PulsMatch,
} from '@/lib/puls-ui'

// ── Gauge SVG — viewBox sized to fit LUGNT/HETT labels without clipping ───────
function PulsGauge({ score, needleClr, isDark }: { score: number; needleClr: string; isDark: boolean }) {
  // cx=100 centers in 200-wide viewBox; labels sit at x≈28 and x≈172, comfortably within bounds
  const cx = 100, cy = 80, r = 66, sw = 13
  const arcLen = Math.PI * r
  const dashOffset = arcLen * (1 - score)
  const z65a = Math.PI * (1 - 0.65)
  const z65x = cx + r * Math.cos(z65a), z65y = cy - r * Math.sin(z65a)
  const needleLen = 52
  const needleDeg = -(score * 180)
  const trackClr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tickClr  = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'
  const lblClr   = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)'
  const bgClr    = isDark ? '#10161e' : '#f5f2ec'

  return (
    <svg viewBox="0 0 200 90" style={{ width: '100%', display: 'block' }}>
      {/* Track */}
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke={trackClr} strokeWidth={sw} strokeLinecap="butt" />
      {/* Zone tints */}
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${z65x} ${z65y}`}
        fill="none" stroke="rgba(56,160,136,0.16)" strokeWidth={sw} strokeLinecap="butt" />
      <path d={`M ${z65x} ${z65y} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke="rgba(245,194,0,0.16)" strokeWidth={sw} strokeLinecap="butt" />
      {/* Animated fill */}
      <motion.path
        d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke={needleClr} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={arcLen}
        initial={{ strokeDashoffset: arcLen }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={score > 0.85 ? { filter: `drop-shadow(0 0 6px ${needleClr})` } : {}}
      />
      {/* Tick marks */}
      {[0.25, 0.5, 0.75].map(t => {
        const ta = Math.PI * (1 - t)
        const x1 = cx + (r - sw / 2 - 2) * Math.cos(ta)
        const y1 = cy - (r - sw / 2 - 2) * Math.sin(ta)
        const x2 = cx + (r + sw / 2 + 2) * Math.cos(ta)
        const y2 = cy - (r + sw / 2 + 2) * Math.sin(ta)
        return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tickClr} strokeWidth={1.5} />
      })}
      {/* Needle */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: needleDeg }}
        transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <line x1={cx} y1={cy} x2={cx - needleLen} y2={cy}
          stroke={needleClr} strokeWidth={2.5} strokeLinecap="round" />
      </motion.g>
      <circle cx={cx} cy={cy} r={6} fill={needleClr} />
      <circle cx={cx} cy={cy} r={3} fill={bgClr} />
      {/* Zone labels — positioned outside arc, inside viewBox */}
      <text x={cx - r - 6} y={cy + 4} textAnchor="end"
        fill={lblClr} fontSize={9} fontFamily="system-ui,sans-serif" fontWeight={700}>LUGNT</text>
      <text x={cx + r + 6} y={cy + 4} textAnchor="start"
        fill={lblClr} fontSize={9} fontFamily="system-ui,sans-serif" fontWeight={700}>HETT</text>
    </svg>
  )
}

// ── Game-by-game bar strip ────────────────────────────────────────────────────
// Baseline 185 = solid club-league bowling; bars turn teal above, muted below, gold at 250+
const BASELINE = 185

function GameStrip({
  games,
  label,
  align,
  isCurrentGame,
}: {
  games: number[]
  label: string
  align: 'left' | 'right'
  isCurrentGame?: boolean
}) {
  const barH = 36
  return (
    <div className="min-w-0 flex-1">
      <div
        className={cn(
          'mb-[5px] truncate text-[8px] font-bold tracking-wide text-dark-muted',
          align === 'right' ? 'text-right' : 'text-left',
        )}
      >
        {label}
      </div>
      <div style={{ display: 'flex', gap: 4, justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end' }}>
        {games.map((g, i) => {
          const barPx = Math.max(4, ((g - 100) / (300 - 100)) * barH)
          const isGold = g >= 250
          const isGood = g >= PULS_BASELINE
          const clr = isGold ? '#f5c200' : isGood ? '#38a088' : '#6b7a99'
          const isLatest = i === games.length - 1 && isCurrentGame !== false
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {isGold && (
                <div style={{ fontSize: 7, fontWeight: 900, color: '#f5c200', lineHeight: 1 }}>★</div>
              )}
              <div style={{ width: 16, height: barPx, borderRadius: 3, background: clr,
                opacity: isLatest ? 1 : 0.6,
                boxShadow: isGold ? '0 0 6px rgba(245,194,0,0.5)' : undefined }} />
              <div style={{ fontSize: 8, color: clr, fontWeight: isLatest ? 800 : 600,
                fontVariantNumeric: 'tabular-nums' }}>{g}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PulsPageContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const C = {
    text: isDark ? '#e8edf5' : '#1a2535',
    textMuted: '#6b7a99',
  }

  const [matches, setMatches] = useState<PulsMatch[]>([])
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('followedTeams')
      if (raw) setFollowedIds(new Set(JSON.parse(raw)))
    } catch {}
  }, [])

  useEffect(() => {
    if (PULS_DEMO) {
      setMatches(PULS_MOCK_LIVE)
      setLoading(false)
      return
    }
    // real fetch here
  }, [])

  const sorted = [...matches].sort((a, b) => tensionScore(b) - tensionScore(a))
  const skelClr = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg pb-20 dark:bg-dark-bg">
        <style>{PULS_STYLES}</style>
        <div className="skel-wrap flex flex-col gap-4 p-4 pt-5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card"
            >
              <div style={{ height: 3, background: skelClr }} />
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: skelClr }} />
                  <div style={{ flex: 1 }} />
                  <div style={{ width: 60, height: 20, borderRadius: 4, background: skelClr }} />
                </div>
                <div style={{ height: 90, borderRadius: 8, background: skelClr }} />
                <div style={{ height: 10, width: '55%', borderRadius: 5, background: skelClr, alignSelf: 'center' }} />
                <div style={{ height: 36, borderRadius: 8, background: skelClr }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2.5 bg-light-bg pb-20 dark:bg-dark-bg">
        <style>{PULS_STYLES}</style>
        <p className="text-[13px] font-bold tracking-wide text-dark-muted">
          INGA LIVE-MATCHER JUST NU
        </p>
        <p className="text-[11px] text-dark-muted">Kom tillbaka på matchdag</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-bg pb-20 dark:bg-dark-bg">
      <style>{PULS_STYLES}</style>

      <div className="flex items-center gap-2.5 px-4 pt-5">
        <h1 className="m-0 text-[22px] font-black tracking-tight text-light-text dark:text-dark-text">
          MATCHPULSEN
        </h1>
        <span className="flex items-center gap-1 rounded-[20px] border border-red/30 bg-red/10 px-2 py-0.5 text-[10px] font-bold text-red">
          <span className="live-dot inline-block size-[5px] shrink-0 rounded-full bg-red" />
          {sorted.length} LIVE
        </span>
      </div>
      <p className="px-4 pt-1 pb-4 text-[11px] text-dark-muted">Rankad efter spänning</p>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px 16px' }}>
        {sorted.map((m, rank) => {
          const score      = tensionScore(m)
          const h = m.home_score!, a = m.away_score!
          const isTied     = h === a
          const isFollowed = followedIds.has(m.home.id) || followedIds.has(m.away.id)
          const needleClr = rank === 0 ? '#f5c200' : tensionColor(score) || '#6b7a99'
          const insight    = tensionInsight(m)
          const streams    = m.streams ?? []

          const borderClr = isFollowed
            ? 'rgba(245,194,0,0.5)'
            : rank === 0
              ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)')
              : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')

          return (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rank * 0.07, duration: 0.28 }}
              style={{ borderRadius: 16, overflow: 'hidden',
                border: `1px solid ${borderClr}`,
                boxShadow: isFollowed
                  ? '0 0 0 3px rgba(245,194,0,0.12), 0 0 28px rgba(245,194,0,0.1)'
                  : rank === 0
                    ? (isDark ? '0 4px 28px rgba(0,0,0,0.45)' : '0 4px 20px rgba(0,0,0,0.1)')
                    : undefined,
                background: isTied
                  ? (isDark ? 'linear-gradient(145deg,rgba(245,194,0,0.08) 0%,rgba(11,21,40,0.98) 100%)' : 'linear-gradient(145deg,rgba(245,194,0,0.04) 0%,rgba(248,248,252,1) 100%)')
                  : (isDark ? 'linear-gradient(145deg,rgba(255,255,255,0.03) 0%,rgba(11,21,40,0.98) 100%)' : 'linear-gradient(145deg,rgba(0,0,0,0.015) 0%,rgba(248,248,252,1) 100%)') }}>

              {/* Accent bar — thicker for #1 */}
              <div style={{ height: rank === 0 ? 4 : 3,
                background: `linear-gradient(90deg,${needleClr},${needleClr}20)` }} />

              <div style={{ padding: '14px 16px 16px' }}>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  {/* Rank badge — #1 always gold */}
                  <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                    background: rank === 0 ? '#f5c200' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 900,
                      color: rank === 0 ? '#10161e' : C.textMuted }}>
                      {rank + 1}
                    </span>
                  </div>
                  {isFollowed && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#f5c200',
                      background: 'rgba(245,194,0,0.12)', border: '1px solid rgba(245,194,0,0.3)',
                      padding: '2px 7px', borderRadius: 4, letterSpacing: 0.3 }}>DITT LAG</span>
                  )}
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: pulsDivColor(m.division),
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    padding: '3px 9px', borderRadius: 4, letterSpacing: 0.3 }}>{shortDiv(m.division)}</span>
                </div>

                {/* Teams + gauge */}
                <a href={'/matches/' + m.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                    WebkitTapHighlightColor: 'transparent' } as any}>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 3, letterSpacing: 0.5 }}>HEMMA</div>
                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: 900,
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                        color: h > a ? C.text : isTied ? C.text : C.textMuted,
                      }}
                    >
                      {h}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 5, lineHeight: 1.2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: h > a ? C.text : isTied ? C.text : C.textMuted }}>
                      {shortName(m.home?.name || '')}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, width: 160 }}>
                    <PulsGauge score={score} needleClr={needleClr} isDark={isDark} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 3, letterSpacing: 0.5 }}>BORTA</div>
                    <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                      color: a > h ? C.text : isTied ? C.text : C.textMuted }}>{a}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 5, lineHeight: 1.2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: a > h ? C.text : isTied ? C.text : C.textMuted }}>
                      {shortName(m.away?.name || '')}
                    </div>
                  </div>
                </a>

                {/* Insight */}
                {insight && (
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, fontWeight: 700,
                    color: needleClr, letterSpacing: 0.4 }}>
                    {insight}
                  </div>
                )}

                {/* High series — above game bars, more exciting */}
                {m.highSeries && m.highSeries.length > 0 && (
                  <div style={{ marginTop: 12,
                    paddingTop: 12, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: C.textMuted,
                      letterSpacing: 1.3, marginBottom: 7 }}>HÖGA SPEL</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                      {m.highSeries.map((hs, i) => (
                        <div key={i} style={{ fontSize: 10, fontWeight: 700,
                          color: hs.score >= 250 ? '#f5c200' : '#38a088',
                          background: hs.score >= 250 ? 'rgba(245,194,0,0.1)' : 'rgba(56,160,136,0.1)',
                          border: `1px solid ${hs.score >= 250 ? 'rgba(245,194,0,0.28)' : 'rgba(56,160,136,0.28)'}`,
                          borderRadius: 6, padding: '5px 10px',
                          display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{hs.score}</span>
                          <span style={{ color: C.textMuted }}>·</span>
                          <span>{hs.playerName}</span>
                          <span style={{ fontSize: 8, color: C.textMuted }}>
                            {hs.team === 'home' ? shortName(m.home.name) : shortName(m.away.name)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Game-by-game bars */}
                {m.individualGames && (
                  <div style={{ marginTop: 12,
                    paddingTop: 12, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: C.textMuted,
                      letterSpacing: 1.3, marginBottom: 7 }}>SPELPOÄNG</div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                      <GameStrip
                        games={m.individualGames.home}
                        label={shortName(m.home.name)}
                        align="right"
                        isCurrentGame={true}
                      />
                      <div
                        style={{
                          flexShrink: 0,
                          width: 1,
                          alignSelf: 'stretch',
                          background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                        }}
                      />
                      <GameStrip
                        games={m.individualGames.away}
                        label={shortName(m.away.name)}
                        align="left"
                        isCurrentGame={true}
                      />
                    </div>
                  </div>
                )}

                {/* Stream pills */}
                {streams.length > 0 && (
                  <div style={{ marginTop: 12,
                    paddingTop: 12, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {streams.map((s, idx) => {
                      const ss = pulsStreamStyle(s.url)
                      return (
                        <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 10, fontWeight: 700, color: ss.color,
                            background: ss.bg, border: `1px solid ${ss.border}`,
                            borderRadius: 8, padding: '6px 12px', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 5,
                            WebkitTapHighlightColor: 'transparent' } as any}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.color,
                            flexShrink: 0, display: 'inline-block' }} />
                          {ss.label}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
