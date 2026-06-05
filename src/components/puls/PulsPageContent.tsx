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
  pulsCardBgStyle,
  pulsDivColor,
  pulsDivTextStyle,
  pulsGameBarClass,
  pulsGameBarHeight,
  pulsGameScoreClass,
  pulsGaugeTransformOrigin,
  pulsHighSeriesChipClass,
  pulsInsightTextStyle,
  pulsSectionDivider,
  pulsStreamDotStyle,
  pulsStreamPillStyle,
  pulsStreamStyle,
  pulsTopBarStyle,
  tensionColor,
  tensionInsight,
  tensionScore,
  type PulsMatch,
} from '@/lib/puls-ui'

function PulsGauge({
  score,
  needleClr,
  isDark,
}: {
  score: number
  needleClr: string
  isDark: boolean
}) {
  const cx = 100
  const cy = 80
  const r = 66
  const sw = 13
  const arcLen = Math.PI * r
  const dashOffset = arcLen * (1 - score)
  const z65a = Math.PI * (1 - 0.65)
  const z65x = cx + r * Math.cos(z65a)
  const z65y = cy - r * Math.sin(z65a)
  const needleLen = 52
  const needleDeg = -(score * 180)
  const trackClr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tickClr = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'
  const lblClr = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)'
  const bgClr = isDark ? '#10161e' : '#f5f2ec'

  return (
    <svg viewBox="0 0 200 90" className="block w-full">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={trackClr}
        strokeWidth={sw}
        strokeLinecap="butt"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${z65x} ${z65y}`}
        fill="none"
        stroke="rgba(56,160,136,0.16)"
        strokeWidth={sw}
        strokeLinecap="butt"
      />
      <path
        d={`M ${z65x} ${z65y} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="rgba(245,194,0,0.16)"
        strokeWidth={sw}
        strokeLinecap="butt"
      />
      <motion.path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={needleClr}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={arcLen}
        initial={{ strokeDashoffset: arcLen }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={score > 0.85 ? { filter: `drop-shadow(0 0 6px ${needleClr})` } : undefined}
      />
      {[0.25, 0.5, 0.75].map(t => {
        const ta = Math.PI * (1 - t)
        const x1 = cx + (r - sw / 2 - 2) * Math.cos(ta)
        const y1 = cy - (r - sw / 2 - 2) * Math.sin(ta)
        const x2 = cx + (r + sw / 2 + 2) * Math.cos(ta)
        const y2 = cy - (r + sw / 2 + 2) * Math.sin(ta)
        return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tickClr} strokeWidth={1.5} />
      })}
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: needleDeg }}
        transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
        style={pulsGaugeTransformOrigin(cx, cy)}
      >
        <line x1={cx} y1={cy} x2={cx - needleLen} y2={cy} stroke={needleClr} strokeWidth={2.5} strokeLinecap="round" />
      </motion.g>
      <circle cx={cx} cy={cy} r={6} fill={needleClr} />
      <circle cx={cx} cy={cy} r={3} fill={bgClr} />
      <text
        x={cx - r - 6}
        y={cy + 4}
        textAnchor="end"
        fill={lblClr}
        fontSize={9}
        fontFamily="system-ui,sans-serif"
        fontWeight={700}
      >
        LUGNT
      </text>
      <text
        x={cx + r + 6}
        y={cy + 4}
        textAnchor="start"
        fill={lblClr}
        fontSize={9}
        fontFamily="system-ui,sans-serif"
        fontWeight={700}
      >
        HETT
      </text>
    </svg>
  )
}

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
      <div
        className={cn(
          'flex items-end gap-1',
          align === 'right' ? 'justify-end' : 'justify-start',
        )}
      >
        {games.map((g, i) => {
          const barPx = Math.max(4, ((g - 100) / (300 - 100)) * barH)
          const isGold = g >= 250
          const isLatest = i === games.length - 1 && isCurrentGame !== false
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              {isGold && <div className="text-[7px] leading-none font-black text-gold">★</div>}
              <div className={pulsGameBarClass(g, isLatest)} style={pulsGameBarHeight(barPx)} />
              <div className={pulsGameScoreClass(g, isLatest)}>{g}</div>
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

  const [matches, setMatches] = useState<PulsMatch[]>([])
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('followedTeams')
      if (raw) setFollowedIds(new Set(JSON.parse(raw)))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (PULS_DEMO) {
      setMatches(PULS_MOCK_LIVE)
      setLoading(false)
      return
    }
  }, [])

  const sorted = [...matches].sort((a, b) => tensionScore(b) - tensionScore(a))

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg pb-20 dark:bg-dark-bg">
        <div className="puls-skel-wrap flex flex-col gap-4 p-4 pt-5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card"
            >
              <div className="h-[3px] bg-black/7 dark:bg-white/7" />
              <div className="flex flex-col gap-3 p-4">
                <div className="flex gap-2">
                  <div className="h-5 w-5 rounded-md bg-black/7 dark:bg-white/7" />
                  <div className="flex-1" />
                  <div className="h-5 w-[60px] rounded bg-black/7 dark:bg-white/7" />
                </div>
                <div className="h-[90px] rounded-lg bg-black/7 dark:bg-white/7" />
                <div className="mx-auto h-2.5 w-[55%] rounded bg-black/7 dark:bg-white/7" />
                <div className="h-9 rounded-lg bg-black/7 dark:bg-white/7" />
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
        <p className="text-[13px] font-bold tracking-wide text-dark-muted">INGA LIVE-MATCHER JUST NU</p>
        <p className="text-[11px] text-dark-muted">Kom tillbaka på matchdag</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-bg pb-20 dark:bg-dark-bg">
      <div className="flex items-center gap-2.5 px-4 pt-5">
        <h1 className="m-0 text-[22px] font-black tracking-tight bk-text-primary">MATCHPULSEN</h1>
        <span className="flex items-center gap-1 rounded-[20px] border border-red/30 bg-red/10 px-2 py-0.5 text-[10px] font-bold text-red">
          <span className="puls-live-dot inline-block size-[5px] shrink-0 rounded-full bg-red" />
          {sorted.length} LIVE
        </span>
      </div>
      <p className="px-4 pt-1 pb-4 text-[11px] text-dark-muted">Rankad efter spänning</p>

      <div className="flex flex-col gap-4 px-4 pb-4">
        {sorted.map((m, rank) => {
          const score = tensionScore(m)
          const h = m.home_score!
          const a = m.away_score!
          const isTied = h === a
          const isFollowed = followedIds.has(m.home.id) || followedIds.has(m.away.id)
          const needleClr = rank === 0 ? '#f5c200' : tensionColor(score) || '#6b7a99'
          const insight = tensionInsight(m)
          const streams = m.streams ?? []

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rank * 0.07, duration: 0.28 }}
              className={cn(
                'overflow-hidden rounded-2xl',
                isFollowed &&
                  'border border-gold/50 shadow-[0_0_0_3px_rgba(245,194,0,0.12),0_0_28px_rgba(245,194,0,0.1)]',
                !isFollowed &&
                  rank === 0 &&
                  'border border-black/14 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:border-white/14 dark:shadow-[0_4px_28px_rgba(0,0,0,0.45)]',
                !isFollowed &&
                  rank !== 0 &&
                  'border border-black/8 dark:border-white/8',
              )}
              style={pulsCardBgStyle(isTied, isDark)}
            >
              <div
                className={cn(rank === 0 ? 'h-1' : 'h-[3px]')}
                style={pulsTopBarStyle(needleClr)}
              />

              <div className="px-4 pt-3.5 pb-4">
                <div className="mb-3.5 flex items-center gap-1.5">
                  <div
                    className={cn(
                      'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px]',
                      rank === 0 ? 'bg-gold' : 'bg-black/6 dark:bg-white/8',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-black',
                        rank === 0 ? 'text-[#10161e]' : 'text-dark-muted',
                      )}
                    >
                      {rank + 1}
                    </span>
                  </div>
                  {isFollowed && (
                    <span className="rounded border border-gold/30 bg-gold/12 px-1.75 py-0.5 text-[9px] font-bold tracking-wide text-gold">
                      DITT LAG
                    </span>
                  )}
                  <span className="flex-1" />
                  <span
                    className="rounded bg-black/6 px-2.25 py-0.5 text-[9px] font-bold tracking-wide dark:bg-white/7"
                    style={pulsDivTextStyle(pulsDivColor(m.division))}
                  >
                    {shortDiv(m.division)}
                  </span>
                </div>

                <a
                  href={'/matches/' + m.id}
                  className="flex items-center gap-3 no-underline [-webkit-tap-highlight-color:transparent]"
                >
                  <div className="min-w-0 flex-1 text-right">
                    <div className="mb-0.5 text-[9px] tracking-wide text-dark-muted">HEMMA</div>
                    <div
                      className={cn(
                        'text-4xl leading-none font-black tabular-nums',
                        h > a || isTied ? 'bk-text-primary' : 'text-dark-muted',
                      )}
                    >
                      {h}
                    </div>
                    <div
                      className={cn(
                        'mt-1.25 truncate text-[13px] leading-tight font-extrabold',
                        h > a || isTied ? 'bk-text-primary' : 'text-dark-muted',
                      )}
                    >
                      {shortName(m.home?.name || '')}
                    </div>
                  </div>

                  <div className="w-40 shrink-0">
                    <PulsGauge score={score} needleClr={needleClr} isDark={isDark} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-[9px] tracking-wide text-dark-muted">BORTA</div>
                    <div
                      className={cn(
                        'text-4xl leading-none font-black tabular-nums',
                        a > h || isTied ? 'bk-text-primary' : 'text-dark-muted',
                      )}
                    >
                      {a}
                    </div>
                    <div
                      className={cn(
                        'mt-1.25 truncate text-[13px] leading-tight font-extrabold',
                        a > h || isTied ? 'bk-text-primary' : 'text-dark-muted',
                      )}
                    >
                      {shortName(m.away?.name || '')}
                    </div>
                  </div>
                </a>

                {insight && (
                  <div
                    className="mt-2.5 text-center text-[11px] font-bold tracking-wide"
                    style={pulsInsightTextStyle(needleClr)}
                  >
                    {insight}
                  </div>
                )}

                {m.highSeries && m.highSeries.length > 0 && (
                  <div className={cn('mt-3', pulsSectionDivider)}>
                    <div className="mb-1.75 text-[8px] font-extrabold tracking-widest text-dark-muted">
                      HÖGA SPEL
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.highSeries.map((hs, i) => (
                        <div key={i} className={pulsHighSeriesChipClass(hs.score)}>
                          <span className="font-black tabular-nums">{hs.score}</span>
                          <span className="text-dark-muted">·</span>
                          <span>{hs.playerName}</span>
                          <span className="text-[8px] text-dark-muted">
                            {hs.team === 'home' ? shortName(m.home.name) : shortName(m.away.name)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {m.individualGames && (
                  <div className={cn('mt-3', pulsSectionDivider)}>
                    <div className="mb-1.75 text-[8px] font-extrabold tracking-widest text-dark-muted">
                      SPELPOÄNG
                    </div>
                    <div className="flex items-end gap-4">
                      <GameStrip
                        games={m.individualGames.home}
                        label={shortName(m.home.name)}
                        align="right"
                        isCurrentGame
                      />
                      <div className="w-px shrink-0 self-stretch bg-black/7 dark:bg-white/7" />
                      <GameStrip
                        games={m.individualGames.away}
                        label={shortName(m.away.name)}
                        align="left"
                        isCurrentGame
                      />
                    </div>
                  </div>
                )}

                {streams.length > 0 && (
                  <div className={cn('mt-3 flex flex-wrap gap-1.5', pulsSectionDivider)}>
                    {streams.map((s, idx) => {
                      const ss = pulsStreamStyle(s.url)
                      return (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.25 rounded-lg px-3 py-1.5 text-[10px] font-bold no-underline [-webkit-tap-highlight-color:transparent]"
                          style={pulsStreamPillStyle(ss)}
                        >
                          <span
                            className="inline-block size-[5px] shrink-0 rounded-full"
                            style={pulsStreamDotStyle(ss.color)}
                          />
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
