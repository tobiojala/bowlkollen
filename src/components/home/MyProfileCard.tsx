'use client'

import { cn } from '@/lib/cn'
import { shortDiv } from '@/lib/utils'

type Props = {
  name: string
  team: string
  division: string
  average: number
  lastScores: number[]
}

export function MyProfileCard({ name, team, division, average, lastScores }: Props) {
  return (
    <div className="px-4 pt-4">
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-[#38a088]/30',
          'bg-linear-to-br from-[#38a088]/10 via-transparent to-light-bg dark:from-[#38a088]/10 dark:to-dark-bg',
        )}
      >
        <div className="h-[3px] bg-linear-to-r from-[#38a088] to-[#38a088]/15" />
        <div className="px-4 py-3.5 pb-4">
          <div className="mb-3.5 flex items-center">
            <span className="flex-1 text-[9px] font-extrabold tracking-wide text-[#38a088]">
              MIN PROFIL
            </span>
            <span className="rounded bg-black/6 px-2 py-0.75 text-[9px] font-bold tracking-wide text-dark-muted dark:bg-white/7">
              Säsong 2026
            </span>
          </div>
          <div className="mb-3.5">
            <div className="text-[17px] font-extrabold bk-text-primary">{name}</div>
            <div className="mt-0.75 text-[10px] text-dark-muted">
              {team} · {shortDiv(division)}
            </div>
          </div>
          <div className="flex items-end gap-5">
            <div>
              <div className="mb-1 text-[9px] font-bold tracking-wide text-dark-muted">SNITT</div>
              <div className="text-[44px] leading-none font-black text-[#38a088] tabular-nums">
                {average}
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-2 text-[9px] font-bold tracking-wide text-dark-muted">SENASTE 5</div>
              <div className="flex items-end gap-1.25">
                {lastScores.map((score, i) => {
                  const pct = (score - 150) / (300 - 150)
                  const barH = Math.round(4 + pct * 36)
                  const isHigh = score >= 220
                  const isAbove = score >= average
                  const barClr = isHigh ? '#f5c200' : isAbove ? '#38a088' : undefined
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="flex h-10 w-7 items-end">
                        <div
                          className={cn(
                            'w-full rounded',
                            !barClr && 'bg-dark-muted',
                          )}
                          style={{
                            height: barH,
                            background: barClr,
                            opacity: i === lastScores.length - 1 ? 1 : 0.7,
                          }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-[9px] tabular-nums',
                          isHigh ? 'font-extrabold text-gold' : isAbove ? 'font-medium text-[#38a088]' : 'text-dark-muted',
                        )}
                      >
                        {score}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
