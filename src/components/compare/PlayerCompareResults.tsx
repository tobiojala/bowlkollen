'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import {
  COMPARE_SPRING,
  PLAYER_COMPARE_METRICS,
  compareColorStyle,
  compareTeamColors,
  compareMetricWinGlowStyle,
  compareWinnerGlowStyle,
  countPlayerMetricWins,
  type PlayerCompareStats,
} from '@/lib/compare-ui'

type Player = { id: string; name: string }

type Props = {
  p1: Player
  p2: Player
  stats1: PlayerCompareStats
  stats2: PlayerCompareStats
}

export function PlayerCompareResults({ p1, p2, stats1, stats2 }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [copied, setCopied] = useState(false)

  const col1 = compareTeamColors(p1.name, dark)
  const col2 = compareTeamColors(p2.name, dark)
  const { p1Wins, p2Wins, overall } = countPlayerMetricWins(stats1, stats2)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: `${p1.name} vs ${p2.name} — Bowlkollen`, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="mx-auto max-w-app pb-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className={cn(
          'grid grid-cols-[1fr_auto_1fr] border-b border-light-border px-5 py-2.5 dark:border-dark-border',
          dark ? 'bg-white/[0.03]' : 'bg-black/[0.03]',
        )}
      >
        <div className="text-center">
          <span
            className={cn(
              'text-[28px] font-black',
              overall === 1 ? 'text-gold' : 'text-dark-muted',
            )}
            style={compareWinnerGlowStyle(overall === 1)}
          >
            {p1Wins}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center px-4 text-center">
          <div className="text-[9px] font-bold tracking-widest text-dark-muted">
            VUNNA KATEGORIER
          </div>
        </div>
        <div className="text-center">
          <span
            className={cn(
              'text-[28px] font-black',
              overall === 2 ? 'text-gold' : 'text-dark-muted',
            )}
            style={compareWinnerGlowStyle(overall === 2)}
          >
            {p2Wins}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="grid grid-cols-[1fr_96px_1fr] gap-2 px-5 pt-3 pb-1.5"
      >
        <div
          className="truncate text-right text-[11px] font-bold"
          style={compareColorStyle(col1.border)}
        >
          {p1.name.split(' ')[0]}
        </div>
        <div />
        <div className="truncate text-[11px] font-bold" style={compareColorStyle(col2.border)}>
          {p2.name.split(' ')[0]}
        </div>
      </motion.div>

      {PLAYER_COMPARE_METRICS.map(({ label, key }, i) => {
        const v1 = stats1[key] as number
        const v2 = stats2[key] as number
        const s1wins = v1 > v2 && v1 > 0
        const s2wins = v2 > v1 && v2 > 0
        const tied = v1 === v2 && v1 > 0
        const rowHighlight = s1wins || s2wins

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...COMPARE_SPRING, delay: 0.22 + i * 0.075 }}
            className={cn(
              'grid grid-cols-[1fr_96px_1fr] items-center gap-2 border-b border-light-border px-5 py-3 dark:border-dark-border',
              rowHighlight && (dark ? 'bg-teal-500/[0.025]' : 'bg-teal-500/[0.02]'),
            )}
          >
            <div className="flex flex-col items-end gap-0.5">
              <motion.span
                animate={{ scale: s1wins ? 1.05 : 1 }}
                transition={COMPARE_SPRING}
                className={cn(
                  'leading-none',
                  s1wins ? 'text-[28px] font-black text-gold' : 'text-[22px] font-normal text-dark-muted',
                )}
                style={compareMetricWinGlowStyle(s1wins)}
              >
                {v1 > 0 ? v1 : '—'}
              </motion.span>
              {s1wins && (
                <span className="text-[7px] font-extrabold tracking-wide text-gold">▲ BÄST</span>
              )}
            </div>

            <div
              className={cn(
                'rounded-[10px] border px-1.5 py-[7px] text-center',
                dark ? 'bg-white/[0.04]' : 'bg-black/[0.04]',
                tied
                  ? 'border-gold/30'
                  : 'border-light-border dark:border-dark-border',
              )}
            >
              <div className="text-[10px] font-bold leading-snug tracking-wide text-dark-muted">
                {label}
              </div>
              {tied && (
                <div className="mt-0.5 text-[7px] font-extrabold tracking-wide text-gold">LIKA</div>
              )}
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <motion.span
                animate={{ scale: s2wins ? 1.05 : 1 }}
                transition={COMPARE_SPRING}
                className={cn(
                  'leading-none',
                  s2wins ? 'text-[28px] font-black text-gold' : 'text-[22px] font-normal text-dark-muted',
                )}
                style={compareMetricWinGlowStyle(s2wins)}
              >
                {v2 > 0 ? v2 : '—'}
              </motion.span>
              {s2wins && (
                <span className="text-[7px] font-extrabold tracking-wide text-gold">▲ BÄST</span>
              )}
            </div>
          </motion.div>
        )
      })}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          ...COMPARE_SPRING,
          delay: 0.22 + PLAYER_COMPARE_METRICS.length * 0.075 + 0.12,
        }}
        className={cn(
          'mx-5 mt-5 rounded-[18px] border p-5 text-center',
          overall !== 0
            ? 'border-gold/30 bg-gold/[0.08]'
            : 'border-gold/30 bg-gold/[0.06] dark:bg-gold/[0.06]',
        )}
      >
        <div className="mb-2 text-[9px] font-extrabold tracking-widest text-gold">
          SAMMANTAGET RESULTAT
        </div>
        {overall !== 0 ? (
          <>
            <div
              className="text-[19px] font-black"
              style={compareColorStyle(overall === 1 ? col1.border : col2.border)}
            >
              {overall === 1 ? p1.name : p2.name}
            </div>
            <p className="mt-1 text-[13px] text-dark-muted">
              vinner {overall === 1 ? p1Wins : p2Wins}–{overall === 1 ? p2Wins : p1Wins} i kategorier
            </p>
          </>
        ) : (
          <>
            <div className="text-[19px] font-black text-gold">Jämnspelt!</div>
            <p className="mt-1 text-[13px] text-dark-muted">
              Båda spelarna är lika starka — {p1Wins}–{p2Wins}
            </p>
          </>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="mt-4 w-full cursor-pointer rounded-xl border border-gold/30 bg-transparent py-2 text-[13px] font-bold text-gold"
        >
          {copied ? '✓ Länk kopierad!' : 'Dela jämförelsen →'}
        </button>
      </motion.div>
    </div>
  )
}
