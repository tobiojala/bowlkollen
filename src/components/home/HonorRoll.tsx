'use client'

import Link from 'next/link'
import { SectionHeader } from '@/components/ui'
import { cn } from '@/lib/cn'

type HonorEntry = { playerName: string; score: number; matchId: string; seriesTotal?: number }

type Props = { honor: HonorEntry[] }

export default function HonorRoll({ honor }: Props) {
  if (honor.length === 0) return null

  return (
    <div className="mt-4">
      <SectionHeader label="HONOR ROLL" sub="· senaste 7 dagarna" />

      <div
        className={cn(
          'flex gap-2.5 overflow-x-auto px-4 py-3 pb-4',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {honor.map((e, i) => {
          const isPerfect = e.score === 300
          const isHighSeries = !isPerfect && (e.seriesTotal ?? 0) >= 950
          const isElite = !isPerfect && !isHighSeries && e.score >= 250
          const nameParts = e.playerName.split(' ')
          const firstName = nameParts[0]
          const lastName = nameParts.slice(1).join(' ')

          if (isPerfect) {
            return (
              <Link
                key={i}
                href={`/matches/${e.matchId}`}
                className={cn(
                  'min-w-24 shrink-0 rounded-[14px] border border-white/18 px-3.5 py-3 text-center no-underline',
                  'bg-black shadow-[inset_0_0_28px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.6)]',
                )}
              >
                <div className="mb-1.5 flex h-4 items-center justify-center">
                  <div className="bg-linear-to-r from-[#8a98b8] via-white to-[#8a98b8] bg-clip-text text-[7px] font-black tracking-[1.8px] text-transparent">
                    ◆ PERFECT
                  </div>
                </div>
                <div className="text-[48px] leading-none font-black text-white [text-shadow:0_0_2px_#fff,0_0_10px_rgba(255,255,255,0.75),0_0_28px_rgba(255,255,255,0.25)]">
                  300
                </div>
                {e.seriesTotal ? (
                  <div className="mt-1 text-[8px] font-bold tracking-wide text-[rgba(170,185,220,0.6)]">
                    {e.seriesTotal} serie
                  </div>
                ) : null}
                <div className="mt-[7px] max-w-[84px] truncate text-[11px] font-bold text-[rgba(215,222,240,0.85)]">
                  {firstName}
                </div>
                <div className="max-w-[84px] truncate text-[10px] text-[rgba(140,155,185,0.7)]">
                  {lastName || ' '}
                </div>
              </Link>
            )
          }

          if (isHighSeries) {
            return (
              <Link
                key={i}
                href={`/matches/${e.matchId}`}
                className={cn(
                  'min-w-[86px] shrink-0 rounded-[13px] border border-white/11 px-3.5 py-3 text-center no-underline',
                  'bg-[#07080e] shadow-[inset_0_0_18px_rgba(0,0,0,0.7),0_4px_20px_rgba(0,0,0,0.45)]',
                )}
              >
                <div className="mb-1.5 flex h-4 items-center justify-center">
                  <div className="bg-linear-to-r from-[#6a7a9a] via-[#bcc8e0] to-[#6a7a9a] bg-clip-text text-[7px] font-extrabold tracking-[1.5px] text-transparent">
                    ◇ SERIE
                  </div>
                </div>
                <div className="text-[36px] leading-none font-black text-[#d8dff0] [text-shadow:0_0_8px_rgba(205,218,255,0.55),0_0_22px_rgba(175,198,255,0.2)]">
                  {e.seriesTotal}
                </div>
                <div className="mt-[3px] text-[8px] font-bold tracking-wide text-[rgba(130,150,195,0.65)]">
                  {e.score} bäst
                </div>
                <div className="mt-1.5 max-w-20 truncate text-[11px] font-bold text-[rgba(195,208,235,0.8)]">
                  {firstName}
                </div>
                <div className="max-w-20 truncate text-[10px] text-[rgba(115,132,170,0.7)]">
                  {lastName || ' '}
                </div>
              </Link>
            )
          }

          const label = isElite ? '★ ELITE' : '◼︎ TOP'

          return (
            <Link
              key={i}
              href={`/matches/${e.matchId}`}
              className={cn(
                'min-w-[84px] shrink-0 rounded-xl border px-3.5 py-3 text-center no-underline',
                isElite
                  ? 'border-gold/40 bg-gold/[0.05] shadow-[0_0_20px_rgba(245,194,0,0.08)] dark:bg-gold/[0.05]'
                  : 'border-gold/25 bg-gold/[0.04] dark:bg-gold/[0.04]',
              )}
            >
              <div className="mb-1.5 flex h-4 items-center justify-center">
                <div className="bg-linear-to-r from-[#c8a830] via-gold to-[#c8a830] bg-clip-text text-[7px] font-extrabold tracking-[1.5px] text-transparent">
                  {label}
                </div>
              </div>
              {isElite ? (
                <div className="text-[32px] leading-none font-black text-white [text-shadow:0_0_8px_rgba(255,255,255,0.55),0_0_22px_rgba(255,255,255,0.18)]">
                  {e.score}
                </div>
              ) : (
                <div className="text-[28px] leading-none font-black text-gold [text-shadow:0_0_8px_rgba(245,194,0,0.5),0_0_20px_rgba(245,194,0,0.2)]">
                  {e.score}
                </div>
              )}
              <div className="mt-2 max-w-[78px] truncate text-[11px] font-bold bk-text-primary">
                {firstName}
              </div>
              <div className="max-w-[78px] truncate text-[10px] text-dark-muted">
                {lastName || ' '}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
