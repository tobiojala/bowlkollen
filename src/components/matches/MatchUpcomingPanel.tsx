'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'

type H2HMatch = {
  id: string
  date: string
  home_score: number | null
  away_score: number | null
  home: { name: string }
  away: { name: string }
}

type Props = {
  msLeft: number | null
  matchStarted: boolean
  h2h: H2HMatch[]
}

function MatchCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-light-border bg-light-card dark:border-dark-border dark:bg-white/[0.035]">
      <div className="border-b border-light-border bg-black/[0.02] px-3.5 py-2 dark:border-dark-border dark:bg-white/[0.025]">
        <span className="text-[10px] font-extrabold tracking-wide text-dark-muted">{title}</span>
      </div>
      {children}
    </div>
  )
}

export function MatchUpcomingPanel({ msLeft, matchStarted, h2h }: Props) {
  const cdDays = msLeft !== null ? Math.floor(msLeft / 86_400_000) : null
  const cdHours = msLeft !== null ? Math.floor((msLeft % 86_400_000) / 3_600_000) : null
  const cdMinutes = msLeft !== null ? Math.floor((msLeft % 3_600_000) / 60_000) : null
  const cdSeconds = msLeft !== null ? Math.floor((msLeft % 60_000) / 1_000) : null

  return (
    <div className="flex flex-col gap-3 p-4">
      <MatchCard title={matchStarted ? 'MATCHEN BÖRJAR SNART' : 'MATCHEN BÖRJAR OM'}>
        <div className="px-5 py-7 text-center">
          {msLeft !== null && !matchStarted ? (
            cdDays! > 0 ? (
              <div className="flex items-end justify-center gap-5">
                <div>
                  <div className="text-5xl font-black leading-none text-gold tabular-nums">{cdDays}</div>
                  <div className="mt-1 text-[10px] tracking-widest text-dark-muted">DAGAR</div>
                </div>
                <div>
                  <div className="text-5xl font-black leading-none bk-text-primary tabular-nums">
                    {String(cdHours).padStart(2, '0')}
                  </div>
                  <div className="mt-1 text-[10px] tracking-widest text-dark-muted">TIMMAR</div>
                </div>
              </div>
            ) : (
              <div className="flex items-end justify-center gap-1">
                {[
                  { val: String(cdHours).padStart(2, '0'), label: 'TIM', accent: false },
                  { val: String(cdMinutes).padStart(2, '0'), label: 'MIN', accent: true },
                  { val: String(cdSeconds).padStart(2, '0'), label: 'SEK', accent: false },
                ].map(({ val, label, accent }, i) => (
                  <div key={label} className="flex items-end gap-1">
                    {i > 0 && (
                      <span className="mb-[18px] text-4xl font-black leading-none text-dark-muted/40">:</span>
                    )}
                    <div>
                      <div
                        className={cn(
                          'text-[52px] font-black leading-none tabular-nums',
                          accent ? 'text-gold' : 'bk-text-primary',
                        )}
                      >
                        {val}
                      </div>
                      <div className="mt-1 text-[10px] tracking-widest text-dark-muted">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-base font-bold text-dark-muted">Lineup visas när matchen börjar</p>
          )}
        </div>
      </MatchCard>

      {h2h.length > 0 && (
        <MatchCard title="TIDIGARE MÖTEN">
          {h2h.map((hm, i) => {
            const hmHScore = hm.home_score ?? 0
            const hmAScore = hm.away_score ?? 0
            const hmHWin = hmHScore > hmAScore
            const hmAWin = hmAScore > hmHScore
            const hmDate = hm.date
              ? new Date(hm.date).toLocaleDateString('sv-SE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : ''

            return (
              <Link
                key={hm.id}
                href={`/matches/${hm.id}`}
                className={cn(
                  'block px-3.5 py-2.75 no-underline',
                  i < h2h.length - 1 && 'border-b border-black/5 dark:border-white/5',
                )}
              >
                <div className="mb-1 text-[10px] text-dark-muted">{hmDate}</div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-[13px]',
                      hmHWin ? 'font-extrabold bk-text-primary' : 'font-medium text-dark-muted',
                    )}
                  >
                    {shortName(hm.home?.name || '')}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.25">
                    <span
                      className={cn(
                        'min-w-[18px] text-right text-[15px] font-extrabold tabular-nums',
                        hmHWin ? 'text-gold' : 'text-dark-muted',
                      )}
                    >
                      {hmHScore}
                    </span>
                    <span className="text-[11px] text-dark-muted">–</span>
                    <span
                      className={cn(
                        'min-w-[18px] text-left text-[15px] font-extrabold tabular-nums',
                        hmAWin ? 'text-gold' : 'text-dark-muted',
                      )}
                    >
                      {hmAScore}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-right text-[13px]',
                      hmAWin ? 'font-extrabold bk-text-primary' : 'font-medium text-dark-muted',
                    )}
                  >
                    {shortName(hm.away?.name || '')}
                  </span>
                </div>
              </Link>
            )
          })}
        </MatchCard>
      )}

      {h2h.length === 0 && (
        <p className="py-3 text-center text-xs text-dark-muted">Inga tidigare möten hittades</p>
      )}
    </div>
  )
}
