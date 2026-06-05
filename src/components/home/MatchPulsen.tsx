'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { shortName, shortDiv } from '@/lib/utils'
import {
  divisionAccentColor,
  tensionScore,
  tensionInsight,
  tensionColor,
  accentBgStyle,
  accentTextStyle,
  gaugeStrokeGlow,
  gaugeTransformOrigin,
  tensionBarStyle,
  type MatchLike,
} from '@/lib/match-ui'
import {
  homeDivisionChipColorStyle,
  homeNoTapHighlight,
  homePulsDivisionChip,
  homePulsTopBarStyle,
} from '@/lib/home-ui'
import { StreamPills } from '@/components/home/StreamPills'

type Props = {
  matches: MatchLike[]
  followedIds: Set<string>
}

export function MatchPulsen({ matches, followedIds }: Props) {
  if (matches.length === 0) return null

  const sorted = [...matches].sort((a, b) => tensionScore(b) - tensionScore(a))
  const hot = sorted[0]
  const score = tensionScore(hot)
  const h = hot.home_score!
  const a = hot.away_score!
  const isTied = h === a
  const isFollowed = followedIds.has(hot.home.id) || followedIds.has(hot.away.id)
  const needleClr = tensionColor(score)
  const streams = hot.streams ?? []
  const insight = tensionInsight(hot)

  const cx = 50
  const cy = 60
  const r = 44
  const sw = 9
  const arcLen = Math.PI * r
  const dashOffset = arcLen * (1 - score)
  const z65a = Math.PI * (1 - 0.65)
  const z65x = cx + r * Math.cos(z65a)
  const z65y = cy - r * Math.sin(z65a)
  const needleLen = 32
  const needleDeg = -(score * 180)

  return (
    <div className="px-4 pt-4">
      <div
        className={cn(
          'overflow-hidden rounded-2xl border',
          isFollowed &&
            'border-gold/50 shadow-[0_0_0_3px_rgba(245,194,0,0.12),0_0_28px_rgba(245,194,0,0.1)]',
          isTied
            ? 'border-gold/35 bg-linear-to-br from-gold/8 to-light-bg dark:to-dark-bg'
            : 'border-light-border bg-linear-to-br from-black/2 to-light-bg dark:border-dark-border dark:from-white/3 dark:to-dark-bg',
        )}
      >
        <div className="h-[3px]" style={homePulsTopBarStyle(needleClr)} />
        <div className="px-4 py-3 pb-4">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="flex-1 text-[9px] font-extrabold tracking-wide" style={accentTextStyle(needleClr)}>
              MATCHPULSEN
            </span>
            {isFollowed && (
              <span className="rounded border border-gold/30 bg-gold/12 px-[7px] py-0.5 text-[9px] font-bold tracking-wide text-gold">
                DITT LAG
              </span>
            )}
            <span
              className={homePulsDivisionChip}
              style={homeDivisionChipColorStyle(divisionAccentColor(hot.division))}
            >
              {shortDiv(hot.division)}
            </span>
          </div>

          <Link
            href={`/matches/${hot.id}`}
            className={cn('flex items-center gap-2 no-underline', homeNoTapHighlight)}
          >
            <div className="min-w-0 flex-1 text-right">
              <div className="mb-0.5 text-[9px] tracking-wide text-dark-muted">HEMMA</div>
              <div
                className={cn(
                  'text-[28px] leading-none font-black tabular-nums',
                  h > a || isTied ? 'bk-text-primary' : 'text-dark-muted',
                )}
              >
                {h}
              </div>
              <div
                className={cn(
                  'mt-1 truncate text-[11px] font-bold leading-tight',
                  h > a || isTied ? 'bk-text-primary' : 'text-dark-muted',
                )}
              >
                {shortName(hot.home?.name || '')}
              </div>
            </div>

            <div className="w-[100px] shrink-0">
              <svg viewBox="0 0 100 66" className="block w-full">
                <path
                  d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                  fill="none"
                  className="stroke-black/8 dark:stroke-white/8"
                  strokeWidth={sw}
                />
                <path
                  d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${z65x} ${z65y}`}
                  fill="none"
                  stroke="rgba(56,160,136,0.2)"
                  strokeWidth={sw}
                />
                <path
                  d={`M ${z65x} ${z65y} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                  fill="none"
                  stroke="rgba(245,194,0,0.2)"
                  strokeWidth={sw}
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
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={isTied ? gaugeStrokeGlow(needleClr) : {}}
                />
                {[0.25, 0.5, 0.75].map(t => {
                  const ta = Math.PI * (1 - t)
                  const x1 = cx + (r - sw / 2 - 1) * Math.cos(ta)
                  const y1 = cy - (r - sw / 2 - 1) * Math.sin(ta)
                  const x2 = cx + (r + sw / 2 + 1) * Math.cos(ta)
                  const y2 = cy - (r + sw / 2 + 1) * Math.sin(ta)
                  return (
                    <line
                      key={t}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className="stroke-black/16 dark:stroke-white/20"
                      strokeWidth={1}
                    />
                  )
                })}
                <motion.g
                  initial={{ rotate: 0 }}
                  animate={{ rotate: needleDeg }}
                  transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                  style={gaugeTransformOrigin(cx, cy)}
                >
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx - needleLen}
                    y2={cy}
                    stroke={needleClr}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </motion.g>
                <circle cx={cx} cy={cy} r={4} fill={needleClr} />
                <circle cx={cx} cy={cy} r={2} className="fill-light-bg dark:fill-dark-bg" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-[9px] tracking-wide text-dark-muted">BORTA</div>
              <div
                className={cn(
                  'text-[28px] leading-none font-black tabular-nums',
                  a > h || isTied ? 'bk-text-primary' : 'text-dark-muted',
                )}
              >
                {a}
              </div>
              <div
                className={cn(
                  'mt-1 truncate text-[11px] font-bold leading-tight',
                  a > h || isTied ? 'bk-text-primary' : 'text-dark-muted',
                )}
              >
                {shortName(hot.away?.name || '')}
              </div>
            </div>
          </Link>

          {insight ? (
            <p className="mt-2 text-center text-[10px] font-bold tracking-wide" style={accentTextStyle(needleClr)}>
              {insight}
            </p>
          ) : null}

          <StreamPills streams={streams} className="mt-2.5" />

          {sorted.length > 1 && (
            <div className="mt-3 border-t border-light-border pt-2.5 dark:border-dark-border">
              <div className="mb-1.5 text-[8px] font-extrabold tracking-widest text-dark-muted">ALLA LIVE</div>
              {sorted.slice(1).map((m, idx) => {
                const ms = tensionScore(m)
                const dotClr = tensionColor(ms)
                const mh = m.home_score!
                const ma = m.away_score!
                const isLast = idx === sorted.length - 2
                return (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className={cn(
                      'flex items-center gap-2 py-1.75 no-underline',
                      homeNoTapHighlight,
                      !isLast && 'border-b border-light-border dark:border-dark-border',
                    )}
                  >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={accentBgStyle(dotClr)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-bold bk-text-primary">
                        {shortName(m.home.name)} – {shortName(m.away.name)}
                      </div>
                      <div className="mt-px text-[9px] text-dark-muted">{shortDiv(m.division)}</div>
                    </div>
                    <div
                      className={cn(
                        'shrink-0 text-[15px] font-black tabular-nums',
                        mh === ma ? 'text-gold' : 'bk-text-primary',
                      )}
                    >
                      {mh}–{ma}
                    </div>
                    <div className="h-[3px] w-7 shrink-0 overflow-hidden rounded-sm bg-black/8 dark:bg-white/8">
                      <div
                        className="h-full rounded-sm"
                        style={tensionBarStyle(ms, dotClr)}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="mt-3 border-t border-light-border pt-3 text-center dark:border-dark-border">
            <Link
              href="/puls"
              className="text-[9px] font-extrabold tracking-wide no-underline"
              style={accentTextStyle(needleClr)}
            >
              SE MATCHPULSEN →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
