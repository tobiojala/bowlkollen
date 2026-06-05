'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { shortName, shortDiv, dateLabel, countdown } from '@/lib/utils'
import { divisionAccentColor, formResultDotClass } from '@/lib/match-ui'
import { homeDivisionChip, homeDivisionChipColorStyle, homeNoTapHighlight } from '@/lib/home-ui'
import { StreamPills } from '@/components/home/StreamPills'
import type { HeroMatch } from '@/components/home/HeroStrip'

type FormResult = 'W' | 'L' | 'D'

type Props = {
  match: HeroMatch & { venue?: string; oilProfile?: string }
  now: number
  isMyHome: boolean
  homeForm?: FormResult[]
  awayForm?: FormResult[]
  onHide: () => void
}

export function MyNextMatchCard({
  match: m,
  now,
  isMyHome,
  homeForm = [],
  awayForm = [],
  onHide,
}: Props) {
  const cd = countdown(m.date, now)
  const time = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  const dStr = m.date.slice(0, 10)
  const streams = m.streams ?? []
  const dc = divisionAccentColor(m.division)

  return (
    <div className="px-4 pt-3">
      <Link
        href={`/matches/${m.id}`}
        className={cn(
          'block overflow-hidden rounded-2xl border no-underline',
          homeNoTapHighlight,
          'border-[#5a82b4]/35 bg-linear-to-br from-[#5a82b4]/10 via-transparent to-light-bg',
          'dark:from-[#5a82b4]/13 dark:to-dark-bg',
        )}
      >
        <div className="h-[3px] bg-linear-to-r from-[#5a82b4] to-[#5a82b4]/15" />
        <div className="px-4 py-3.5 pb-4">
          <div className="mb-4 flex items-center">
            <span className="flex-1 text-[9px] font-extrabold tracking-wide text-[#5a82b4]">
              DIN NÄSTA MATCH
            </span>
            <span className={cn('mr-2', homeDivisionChip)} style={homeDivisionChipColorStyle(dc)}>
              {shortDiv(m.division)}
            </span>
            <button
              type="button"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                onHide()
              }}
              className="cursor-pointer rounded-lg border-0 bg-black/5 px-2.25 py-[3px] text-[9px] font-bold text-dark-muted dark:bg-white/7"
            >
              dölj ↓
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 text-right">
              <div className="truncate text-base font-extrabold bk-text-primary">
                {shortName(m.home?.name || '')}
              </div>
              <div
                className={cn(
                  'mt-0.75 text-[9px]',
                  isMyHome ? 'font-bold text-[#5a82b4]' : 'text-dark-muted',
                )}
              >
                {isMyHome ? 'MITT LAG' : 'Hemma'}
              </div>
              {homeForm.length > 0 && (
                <>
                  <div className="mt-1.5 text-right text-[7px] font-semibold tracking-wide text-dark-muted">
                    FORM
                  </div>
                  <div className="mt-0.75 flex justify-end gap-0.75">
                    {homeForm.map((r, i) => (
                      <div key={i} className={cn('h-1.5 w-1.5 rounded-full', formResultDotClass(r))} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="min-w-[88px] shrink-0 text-center">
              {cd ? (
                <>
                  <div className="text-[28px] leading-none font-black text-gold tabular-nums">{cd}</div>
                  <div className="mt-1.5 text-[9px] text-dark-muted">
                    {dateLabel(dStr)} · {time}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-extrabold bk-text-primary">{time}</div>
                  <div className="mt-1 text-[9px] text-dark-muted">{dateLabel(dStr)}</div>
                </>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-extrabold bk-text-primary">
                {shortName(m.away?.name || '')}
              </div>
              <div
                className={cn(
                  'mt-0.75 text-[9px]',
                  !isMyHome ? 'font-bold text-[#5a82b4]' : 'text-dark-muted',
                )}
              >
                {!isMyHome ? 'MITT LAG' : 'Borta'}
              </div>
              {awayForm.length > 0 && (
                <>
                  <div className="mt-1.5 text-[7px] font-semibold tracking-wide text-dark-muted">FORM</div>
                  <div className="mt-0.75 flex gap-0.75">
                    {awayForm.map((r, i) => (
                      <div key={i} className={cn('h-1.5 w-1.5 rounded-full', formResultDotClass(r))} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {(m.venue || m.oilProfile) && (
            <p className="mt-3 text-center text-[10px] text-dark-muted">
              {[m.venue, m.oilProfile].filter(Boolean).join(' · ')}
            </p>
          )}

          {streams.length > 0 ? (
            <StreamPills streams={streams} className="mt-3.5" />
          ) : (
            <div className="mt-3.5 flex items-center justify-center gap-1.25">
              <div className="h-[5px] w-[5px] rounded-full bg-[#5a82b4] opacity-70" />
              <span className="text-[9px] font-extrabold tracking-wide text-[#5a82b4]">KOMMANDE</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
