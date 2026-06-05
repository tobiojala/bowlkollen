'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import {
  COMPARE_SPRING,
  TEAM_COMPARE_METRICS,
  compareColorStyle,
  compareProbBarStyle,
  compareTeamColors,
  compareWinProbability,
  compareMetricWinGlowStyle,
  compareWinnerGlowStyle,
  countMetricWins,
  type TeamCompareMatch,
  type TeamCompareStats,
} from '@/lib/compare-ui'

type Team = { id: string; name: string; city: string | null }

type Props = {
  t1: Team
  t2: Team
  stats1: TeamCompareStats
  stats2: TeamCompareStats
  h2h: TeamCompareMatch[]
  id1: string
  id2: string
}

export function TeamCompareResults({ t1, t2, stats1, stats2, h2h, id1, id2 }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [copied, setCopied] = useState(false)

  const col1 = compareTeamColors(t1.name, dark)
  const col2 = compareTeamColors(t2.name, dark)
  const { t1Wins, t2Wins, overall } = countMetricWins(stats1, stats2)
  const { prob1, prob2 } = compareWinProbability(stats1.winRate, stats2.winRate)

  const h2hWins1 = h2h.filter(m =>
    m.home_team_id === id1
      ? m.home_score! > m.away_score!
      : m.away_score! > m.home_score!,
  ).length
  const h2hWins2 = h2h.filter(m =>
    m.home_team_id === id2
      ? m.home_score! > m.away_score!
      : m.away_score! > m.home_score!,
  ).length
  const h2hDraws = h2h.length - h2hWins1 - h2hWins2

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: `${t1.name} vs ${t2.name} — Bowlkollen`, url })
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
            {t1Wins}
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
            {t2Wins}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="border-b border-light-border px-5 py-3.5 dark:border-dark-border"
      >
        <div className="mb-2.5 text-center text-[9px] font-extrabold tracking-widest text-dark-muted">
          VINSTCHANS (baserat på säsongsform)
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="min-w-9 text-right text-[13px] font-extrabold"
            style={compareColorStyle(col1.border)}
          >
            {prob1}%
          </span>
          <div
            className={cn(
              'relative h-2 flex-1 overflow-hidden rounded-lg',
              dark ? 'bg-white/[0.08]' : 'bg-black/[0.08]',
            )}
          >
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: `${prob1}%` }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              className="absolute top-0 left-0 h-full rounded-lg"
              style={compareProbBarStyle(col1.border)}
            />
          </div>
          <span className="min-w-9 text-[13px] font-extrabold" style={compareColorStyle(col2.border)}>
            {prob2}%
          </span>
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-dark-muted">
          <span>{shortName(t1.name)}</span>
          <span>{shortName(t2.name)}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="grid grid-cols-[1fr_110px_1fr] gap-2 px-5 pt-3 pb-1.5"
      >
        <div
          className="truncate text-right text-[11px] font-bold"
          style={compareColorStyle(col1.border)}
        >
          {shortName(t1.name)}
        </div>
        <div />
        <div className="truncate text-[11px] font-bold" style={compareColorStyle(col2.border)}>
          {shortName(t2.name)}
        </div>
      </motion.div>

      {TEAM_COMPARE_METRICS.map(({ label, key, lowerIsBetter, format }, i) => {
        const v1 = stats1[key] as number
        const v2 = stats2[key] as number
        const s1wins = lowerIsBetter ? v1 < v2 : v1 > v2
        const s2wins = lowerIsBetter ? v2 < v1 : v2 > v1
        const tied = v1 === v2
        const fmt = format ?? ((v: number) => String(v))

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...COMPARE_SPRING, delay: 0.22 + i * 0.07 }}
            className="grid grid-cols-[1fr_110px_1fr] items-center gap-2 border-b border-light-border px-5 py-3 dark:border-dark-border"
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
                {v1 > 0 ? fmt(v1) : '—'}
              </motion.span>
              {s1wins && (
                <span className="text-[7px] font-extrabold tracking-wide text-gold">▲ BÄST</span>
              )}
            </div>

            <div
              className={cn(
                'rounded-[10px] border px-1.5 py-[7px] text-center',
                dark ? 'bg-white/[0.04]' : 'bg-black/[0.04]',
                tied && v1 > 0
                  ? 'border-gold/30'
                  : 'border-light-border dark:border-dark-border',
              )}
            >
              <div className="text-[10px] font-bold leading-snug tracking-wide text-dark-muted">
                {label}
              </div>
              {tied && v1 > 0 && (
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
                {v2 > 0 ? fmt(v2) : '—'}
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
          delay: 0.22 + TEAM_COMPARE_METRICS.length * 0.07 + 0.1,
        }}
        className="mx-5 mt-5 rounded-[18px] border border-gold/30 bg-gold/[0.08] p-5 text-center"
      >
        <div className="mb-2 text-[9px] font-extrabold tracking-widest text-gold">SAMMANTAGET</div>
        {overall !== 0 ? (
          <>
            <div
              className="text-[19px] font-black"
              style={compareColorStyle(overall === 1 ? col1.border : col2.border)}
            >
              {shortName(overall === 1 ? t1.name : t2.name)}
            </div>
            <p className="mt-1 text-[13px] text-dark-muted">
              är starkare — vinner {overall === 1 ? t1Wins : t2Wins}–
              {overall === 1 ? t2Wins : t1Wins} i kategorier
            </p>
          </>
        ) : (
          <>
            <div className="text-[19px] font-black text-gold">Jämnspelt!</div>
            <p className="mt-1 text-[13px] text-dark-muted">
              Lagen är lika starka i alla kategorier
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

      {h2h.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            ...COMPARE_SPRING,
            delay: 0.22 + TEAM_COMPARE_METRICS.length * 0.07 + 0.2,
          }}
          className="mx-5 mt-5 overflow-hidden rounded-[18px] border border-light-border dark:border-dark-border"
        >
          <div
            className={cn(
              'flex items-center justify-between border-b border-light-border px-4 py-3 dark:border-dark-border',
              dark ? 'bg-white/[0.03]' : 'bg-black/[0.02]',
            )}
          >
            <span className="text-[10px] font-extrabold tracking-widest text-dark-muted">
              DIREKTMÖTEN · {h2h.length} matcher
            </span>
            <div className="flex gap-2.5 text-xs font-extrabold">
              <span className={h2hWins1 > h2hWins2 ? 'text-gold' : 'text-dark-muted'}>
                {h2hWins1}
              </span>
              <span className="font-normal text-dark-muted">–</span>
              <span className={h2hDraws > 0 ? 'text-dark-muted' : 'text-transparent'}>
                {h2hDraws > 0 ? h2hDraws : '·'}
              </span>
              <span className="font-normal text-dark-muted">–</span>
              <span className={h2hWins2 > h2hWins1 ? 'text-gold' : 'text-dark-muted'}>
                {h2hWins2}
              </span>
            </div>
          </div>

          {h2h.map((m, i) => {
            const isT1Home = m.home_team_id === id1
            const t1Score = isT1Home ? m.home_score! : m.away_score!
            const t2Score = isT1Home ? m.away_score! : m.home_score!
            const t1Won = t1Score > t2Score
            const t2Won = t2Score > t1Score
            const dateStr = m.date
              ? new Date(m.date).toLocaleDateString('sv-SE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : ''

            return (
              <a
                key={m.id}
                href={`/matches/${m.id}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-[11px] no-underline',
                  i < h2h.length - 1 && 'border-b border-light-border dark:border-dark-border',
                )}
              >
                <div className="min-w-[90px] text-[11px] text-dark-muted">{dateStr}</div>
                <div className="flex flex-1 items-center justify-center gap-2">
                  <span
                    className={cn('text-sm', t1Won ? 'font-black' : 'font-medium text-dark-muted')}
                    style={t1Won ? { color: col1.border } : undefined}
                  >
                    {t1Score}
                  </span>
                  <span className="text-[11px] text-dark-muted">–</span>
                  <span
                    className={cn('text-sm', t2Won ? 'font-black' : 'font-medium text-dark-muted')}
                    style={t2Won ? { color: col2.border } : undefined}
                  >
                    {t2Score}
                  </span>
                </div>
                <div className="min-w-[60px] text-right text-[10px] text-dark-muted">
                  {isT1Home ? 'Hemma' : 'Borta'} ›
                </div>
              </a>
            )
          })}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={cn(
            'mx-5 mt-5 rounded-[18px] border border-light-border p-5 text-center dark:border-dark-border',
            dark ? 'bg-white/[0.02]' : 'bg-black/[0.02]',
          )}
        >
          <p className="text-[13px] text-dark-muted">Inga direktmöten registrerade</p>
          <p className="mt-1 text-[11px] text-dark-muted/70">
            Lagen har inte mötts den här säsongen
          </p>
        </motion.div>
      )}
    </div>
  )
}
