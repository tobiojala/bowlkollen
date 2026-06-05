'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'
import { shortName, shortDiv, dateLabel, countdown } from '@/lib/utils'
import { divisionAccentColor } from '@/lib/match-ui'
import {
  homeDivisionChip,
  homeHeroModeCountClass,
  homeHeroModeLabelClass,
  homeHeroModeTabClass,
  homeHeroTopBarLive,
  homeHeroTopBarUpcoming,
  homeNoTapHighlight,
} from '@/lib/home-ui'
import { StreamPills } from '@/components/home/StreamPills'

export type HeroMatch = {
  id: string
  date: string
  status: string
  division: string
  home_score: number | null
  away_score: number | null
  home: { id: string; name: string }
  away: { id: string; name: string }
  streams?: { url: string }[]
}

export type StripMatch = { kind: 'match'; match: HeroMatch }
export type StripTav = {
  kind: 'tavling'
  id: string
  name: string
  sub: string
  dateLabel: string
  venue: string
  href: string
  isPagaende: boolean
}
export type StripItem = StripMatch | StripTav

type Props = {
  liveItems: StripItem[]
  upcomingItems: StripItem[]
  now: number
}

export function HeroStrip({ liveItems, upcomingItems, now }: Props) {
  const hasLive = liveItems.length > 0
  const hasUp = upcomingItems.length > 0
  const [mode, setMode] = useState<'live' | 'upcoming'>(hasLive ? 'live' : 'upcoming')
  const [activeIdx, setActiveIdx] = useState(0)

  const items = mode === 'live' ? liveItems : upcomingItems
  const safeIdx = Math.min(activeIdx, Math.max(0, items.length - 1))
  const item = items[safeIdx]

  const switchMode = (m: 'live' | 'upcoming') => {
    setMode(m)
    setActiveIdx(0)
  }

  if (!item) return null

  return (
    <div className="pb-1">
      {hasLive && hasUp && (
        <div className="flex gap-2 px-4 pt-3">
          {(
            [
              ['live', 'PÅGÅENDE', liveItems.length],
              ['upcoming', 'KOMMANDE', upcomingItems.length],
            ] as const
          ).map(([m, label, count]) => {
            const isAct = mode === m
            const tabMode = m as 'live' | 'upcoming'
            return (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(tabMode)}
                className={homeHeroModeTabClass(isAct, tabMode)}
              >
                <span className={homeHeroModeLabelClass(isAct, tabMode)}>{label}</span>
                <span className={homeHeroModeCountClass(isAct, tabMode)}>{count}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="px-4 pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${safeIdx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {item.kind === 'match' ? (
              <HeroMatchCard match={item.match} mode={mode} now={now} />
            ) : (
              <HeroTavlingCard item={item} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <div
          className={cn(
            'flex gap-2 overflow-x-auto px-4 pt-2.5 pb-1.5',
            '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {items.map((it, i) => (
            <HeroStripThumb
              key={it.kind === 'match' ? it.match.id : it.id}
              item={it}
              isActive={i === safeIdx}
              now={now}
              onSelect={() => setActiveIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HeroMatchCard({
  match: m,
  mode,
  now,
}: {
  match: HeroMatch
  mode: 'live' | 'upcoming'
  now: number
}) {
  const isLive = mode === 'live'
  const dc = divisionAccentColor(m.division)
  const hasScore = m.home_score !== null
  const homeWin = hasScore && m.home_score! > m.away_score!
  const awayWin = hasScore && m.away_score! > m.home_score!
  const cd = !hasScore ? countdown(m.date, now) : null
  const time = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  const dateStr = m.date.slice(0, 10)
  const streams = isLive ? (m.streams ?? []) : []
  const isStream = streams.length > 0
  return (
    <Link
      href={`/matches/${m.id}`}
      className={cn(
        'block overflow-hidden rounded-2xl border no-underline',
        homeNoTapHighlight,
        isLive
          ? 'border-gold/30 bg-linear-to-br from-gold/10 via-transparent to-light-bg dark:from-gold/10 dark:to-dark-bg'
          : 'border-[#5a82b4]/30 bg-linear-to-br from-[#5a82b4]/10 via-transparent to-light-bg dark:from-[#5a82b4]/10 dark:to-dark-bg',
      )}
    >
      <div className={isLive ? homeHeroTopBarLive : homeHeroTopBarUpcoming} />
      <div className="px-4 py-3.5 pb-4">
        <div className="mb-4 flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.25">
                <div className="h-[7px] w-[7px] rounded-full bg-gold shadow-[0_0_6px_#f5c200]" />
                <span className="text-[10px] font-extrabold tracking-widest text-gold">PÅGÅENDE</span>
              </div>
              {isStream && (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red shadow-[0_0_6px_#e05555]" />
                  <span className="text-[9px] font-extrabold tracking-wide text-red">LIVE</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-extrabold tracking-widest text-[#5a82b4]">KOMMANDE</span>
          )}
          <span className={homeDivisionChip} style={{ color: dc }}>
            {shortDiv(m.division)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 text-right">
            <div
              className={cn(
                'truncate text-base font-extrabold leading-tight',
                hasScore && !homeWin ? 'text-dark-muted' : 'bk-text-primary',
              )}
            >
              {shortName(m.home?.name || '')}
            </div>
            <div className="mt-[3px] text-[9px] text-dark-muted">Hemma</div>
          </div>

          <div className="flex w-[88px] shrink-0 flex-col items-center">
            {hasScore ? (
              <div className="flex items-center justify-center gap-1">
                <span className={cn('text-[40px] leading-none font-black tabular-nums', homeWin ? 'text-gold' : 'text-dark-muted')}>
                  {m.home_score}
                </span>
                <span className="-mt-0.5 text-[22px] font-extralight text-dark-muted">–</span>
                <span className={cn('text-[40px] leading-none font-black tabular-nums', awayWin ? 'text-gold' : 'text-dark-muted')}>
                  {m.away_score}
                </span>
              </div>
            ) : cd ? (
              <>
                <div className="text-center text-[28px] leading-none font-black text-gold tabular-nums">{cd}</div>
                <div className="mt-1.5 text-center text-[9px] leading-snug text-dark-muted">
                  {dateLabel(dateStr)}
                  <br />
                  {time}
                </div>
              </>
            ) : (
              <>
                <div className="text-center text-lg font-extrabold bk-text-primary">{time || 'vs'}</div>
                <div className="mt-1 text-center text-[9px] text-dark-muted">{dateLabel(dateStr)}</div>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div
              className={cn(
                'truncate text-base font-extrabold leading-tight',
                hasScore && !awayWin ? 'text-dark-muted' : 'bk-text-primary',
              )}
            >
              {shortName(m.away?.name || '')}
            </div>
            <div className="mt-0.75 text-[9px] text-dark-muted">Borta</div>
          </div>
        </div>

        {isStream ? (
          <StreamPills streams={streams} className="mt-3.5" />
        ) : isLive ? (
          <p className="mt-3.5 text-center text-[10px] font-semibold tracking-wide text-gold/60">
            Tryck för detaljer →
          </p>
        ) : null}
      </div>
    </Link>
  )
}

function HeroTavlingCard({ item }: { item: StripTav }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'block overflow-hidden rounded-2xl border border-gold/25 bg-linear-to-br from-gold/7 via-transparent to-light-bg no-underline dark:from-gold/10 dark:to-dark-bg',
        homeNoTapHighlight,
      )}
    >
      <div className="h-[3px] bg-linear-to-r from-gold to-gold/20" />
      <div className="px-4 py-3.5 pb-4">
        <div className="mb-3.5 flex items-center gap-1.5">
          <span className="text-sm leading-none text-gold">◆</span>
          <span className="text-[10px] font-extrabold tracking-widest text-dark-muted">
            {item.isPagaende ? 'TÄVLING PÅGÅR' : 'KOMMANDE TÄVLING'}
          </span>
        </div>
        <div className="mb-1.5 text-xl leading-tight font-extrabold bk-text-primary">{item.name}</div>
        <div className="text-[11px] text-dark-muted">{item.sub}</div>
        <div className="mb-4 text-[10px] text-dark-muted">
          {item.dateLabel} · {item.venue}
        </div>
        <span className="inline-block rounded-lg bg-gold px-4 py-1.5 text-[11px] font-bold text-[#1a1400]">
          {item.isPagaende ? 'Se tävlingen →' : 'Mer info →'}
        </span>
      </div>
    </Link>
  )
}

function HeroStripThumb({
  item,
  isActive,
  now,
  onSelect,
}: {
  item: StripItem
  isActive: boolean
  now: number
  onSelect: () => void
}) {
  if (item.kind === 'match') {
    const m = item.match
    const dc = divisionAccentColor(m.division)
    const hasScore = m.home_score !== null
    const homeWin = hasScore && m.home_score! > m.away_score!
    const awayWin = hasScore && m.away_score! > m.home_score!
    const isLiveM = m.status === 'live'
    const isStreamM = isLiveM && (m.streams?.length ?? 0) > 0
    const cd = !hasScore ? countdown(m.date, now) : null
    const time = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-[82px] shrink-0 cursor-pointer flex-col items-center gap-[3px] overflow-hidden rounded-xl border px-1.5 py-2',
          homeNoTapHighlight,
          isActive
            ? isLiveM
              ? 'border-gold/55 bg-gold/10 dark:bg-gold/14'
              : 'border-[#5a82b4]/55 bg-[#5a82b4]/10 dark:bg-[#5a82b4]/14'
            : 'border-light-border bg-black/3 dark:border-dark-border dark:bg-white/4',
        )}
      >
        {isStreamM ? (
          <span className="mt-0.5 animate-pulse text-[8px] font-extrabold tracking-wide text-red">● LIVE</span>
        ) : (
          <div
            className={cn(
              'mt-0.5 max-w-[72px] truncate text-[8.5px] font-bold',
              isLiveM ? 'text-gold' : undefined,
            )}
            style={isLiveM ? undefined : { color: dc }}
          >
            {shortDiv(m.division)}
          </div>
        )}
        <div
          className={cn(
            'max-w-[70px] truncate text-[9.5px] font-semibold',
            homeWin ? 'bk-text-primary' : 'text-dark-muted',
          )}
        >
          {shortName(m.home?.name || '')}
        </div>
        <div
          className={cn(
            'text-xs font-extrabold tabular-nums',
            isLiveM ? 'text-gold' : 'text-gold',
          )}
        >
          {hasScore ? `${m.home_score}–${m.away_score}` : cd || time || 'vs'}
        </div>
        <div
          className={cn(
            'max-w-[70px] truncate text-[9.5px] font-semibold',
            awayWin ? 'bk-text-primary' : 'text-dark-muted',
          )}
        >
          {shortName(m.away?.name || '')}
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-[82px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border px-1.5 py-2',
        homeNoTapHighlight,
        isActive
          ? 'border-gold/55 bg-gold/10 dark:bg-gold/14'
          : 'border-light-border bg-black/3 dark:border-dark-border dark:bg-white/4',
      )}
    >
      <span className="text-[15px] leading-none text-gold">◆</span>
      <div className="max-w-[70px] truncate text-center text-[9px] font-bold text-gold">{item.name}</div>
      <div className="text-[8px] text-dark-muted">{item.dateLabel}</div>
    </button>
  )
}
