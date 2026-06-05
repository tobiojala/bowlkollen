'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { formResultBadgeStyle, formResultColor } from '@/lib/team-ui'
import SeasonTimeline from '@/components/SeasonTimeline'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

type Props = {
  completedCount: number
  wins: number
  draws: number
  losses: number
  points: number
  last5: string[]
  ptsFor: number
  ptsAgainst: number
  diff: number
  homeRecord: Record<string, number>
  awayRecord: Record<string, number>
  statsOpen: boolean
  onToggleStats: () => void
  teamId: string
}

export function TeamStatsBar({
  completedCount,
  wins,
  draws,
  losses,
  points,
  last5,
  ptsFor,
  ptsAgainst,
  diff,
  homeRecord,
  awayRecord,
  statsOpen,
  onToggleStats,
  teamId,
}: Props) {
  if (completedCount === 0) return null

  const statCells = [
    { label: 'Matcher', value: completedCount },
    { label: 'Vunna', value: wins, color: 'text-green' },
    { label: 'Oavgjorda', value: draws, color: 'text-dark-muted' },
    { label: 'Forlorade', value: losses, color: 'text-red' },
    { label: 'Poang', value: points, color: 'text-gold' },
  ]

  return (
    <>
      <button
        type="button"
        onClick={onToggleStats}
        className="flex w-full cursor-pointer flex-col border-b border-light-border bg-light-card px-5 pt-3.5 pb-2.5 text-left dark:border-dark-border dark:bg-dark-card"
      >
        <div className="flex">
          {statCells.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                'flex-1 text-center',
                i < 4 && 'border-r border-light-border dark:border-dark-border',
              )}
            >
              <div className={cn('text-lg font-black leading-none tabular-nums', s.color || 'bk-text-primary')}>
                {s.value}
              </div>
              <div className="mt-0.5 text-[9px] tracking-wide text-dark-muted uppercase">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1">
            {last5.map((f, i) => {
              const fc = formResultColor(f as 'V' | 'F' | 'O')
              return (
                <motion.span
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...SPRING, delay: i * 0.05 }}
                  className="rounded-full border px-[9px] py-[3px] text-[10px] font-extrabold tracking-wide"
                  style={formResultBadgeStyle(fc)}
                >
                  {f}
                </motion.span>
              )
            })}
          </div>
          <span className="text-[10px] text-dark-muted">{statsOpen ? '▲ stang' : '▼ mer statistik'}</span>
        </div>
      </button>

      {statsOpen && (
        <div className="border-b border-light-border bg-[#f0f4f8] px-5 py-4 dark:border-dark-border dark:bg-[#1a2535]">
          <div className="mb-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Hemma V/O/F', value: homeRecord },
              { label: 'Borta V/O/F', value: awayRecord },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-[10px] border border-light-border bg-light-card p-2.5 dark:border-dark-border dark:bg-dark-card"
              >
                <div className="mb-1.5 text-[10px] font-bold tracking-wide text-dark-muted uppercase">
                  {s.label}
                </div>
                <div className="flex gap-2">
                  <span className="text-[15px] font-extrabold text-green">{s.value.V || 0}V</span>
                  <span className="text-[15px] font-extrabold text-dark-muted">{s.value.O || 0}O</span>
                  <span className="text-[15px] font-extrabold text-red">{s.value.F || 0}F</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'MP For', value: ptsFor },
              { label: 'MP Mot', value: ptsAgainst },
              {
                label: 'Differens',
                value: (diff >= 0 ? '+' : '') + diff,
                color: diff >= 0 ? 'text-green' : 'text-red',
              },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-[10px] border border-light-border bg-light-card px-2 py-2.5 text-center dark:border-dark-border dark:bg-dark-card"
              >
                <div className={cn('text-base font-extrabold tabular-nums', s.color || 'bk-text-primary')}>
                  {s.value}
                </div>
                <div className="mt-0.5 text-[9px] tracking-wide text-dark-muted uppercase">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <SeasonTimeline teamId={teamId} />
          </div>
        </div>
      )}
    </>
  )
}
