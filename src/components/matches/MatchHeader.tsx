'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import LiveLaneViewer from '@/components/LiveLaneViewer'

type Team = { id: string; name: string }

type Props = {
  division: string | null
  divisionColor: string
  round: number | null
  status: string
  home: Team
  away: Team
  homeTotal: number | null
  awayTotal: number | null
  hGrand: number
  aGrand: number
  dateStr: string
  timeStr: string
  venue: string | null
  oilProfile: string | null
  streamUrl: string | null
}

export function MatchHeader({
  division,
  divisionColor: divColor,
  round,
  status,
  home,
  away,
  homeTotal,
  awayTotal,
  hGrand,
  aGrand,
  dateStr,
  timeStr,
  venue,
  oilProfile,
  streamUrl,
}: Props) {
  const homeWin = (homeTotal ?? 0) > (awayTotal ?? 0)
  const awayWin = (awayTotal ?? 0) > (homeTotal ?? 0)
  const hasScore = homeTotal !== null && awayTotal !== null
  const isLive = status === 'live'
  const isUpcoming = status === 'upcoming'
  const hasStream = !!streamUrl?.length

  return (
    <>
      <div className="flex items-center gap-2 border-b border-light-border px-4 py-3 dark:border-dark-border">
        <div className="h-2 w-2 shrink-0 rounded-sm" style={{ background: divColor }} />
        <span className="text-[11px] font-bold" style={{ color: divColor }}>
          {division || 'Match'}
        </span>
        {round != null && round > 0 && (
          <span className="text-[11px] text-dark-muted">· Omgång {round}</span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-red">
              <span className="inline-block h-[5px] w-[5px] rounded-full bg-red" />
              LIVE
            </span>
          )}
          {isUpcoming && <span className="text-[10px] font-bold text-gold">KOMMANDE</span>}
          {!isLive && !isUpcoming && (
            <span className="text-[10px] font-bold text-dark-muted">AVSLUTAD</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-light-border px-4 py-6 pb-5 dark:border-dark-border">
        <Link href={`/teams/${home.id}`} className="no-underline">
          <div
            className={cn(
              'text-right text-lg font-extrabold leading-tight',
              hasScore && !homeWin ? 'text-dark-muted' : 'bk-text-primary',
            )}
          >
            {shortName(home.name)}
          </div>
          <div className="mt-0.5 text-right text-[11px] text-dark-muted">Hemmalag</div>
        </Link>

        <div className="min-w-[90px] text-center">
          {hasScore ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <span
                  className={cn(
                    'text-[40px] font-black leading-none tabular-nums',
                    homeWin ? 'text-gold' : 'text-dark-muted',
                  )}
                >
                  {homeTotal}
                </span>
                <span className="text-base font-light text-dark-muted">–</span>
                <span
                  className={cn(
                    'text-[40px] font-black leading-none tabular-nums',
                    awayWin ? 'text-gold' : 'text-dark-muted',
                  )}
                >
                  {awayTotal}
                </span>
              </div>
              <div className="mt-1 text-[9px] tracking-widest text-dark-muted">MATCHPOÄNG</div>
              {hGrand > 0 && (
                <div className="mt-1.5 text-[11px] text-dark-muted">
                  {hGrand.toLocaleString('sv')} – {aGrand.toLocaleString('sv')}{' '}
                  <span className="text-[10px]">pins</span>
                </div>
              )}
            </>
          ) : (
            <span className="text-lg font-light text-dark-muted">vs</span>
          )}
        </div>

        <Link href={`/teams/${away.id}`} className="no-underline">
          <div
            className={cn(
              'text-lg font-extrabold leading-tight',
              hasScore && !awayWin ? 'text-dark-muted' : 'bk-text-primary',
            )}
          >
            {shortName(away.name)}
          </div>
          <div className="mt-0.5 text-[11px] text-dark-muted">Bortalag</div>
        </Link>
      </div>

      {(dateStr || venue || oilProfile) && (
        <div className="flex flex-wrap gap-3 border-b border-light-border px-4 py-2.5 dark:border-dark-border">
          {dateStr && (
            <span className="text-[11px] text-dark-muted">
              {dateStr}
              {timeStr ? ` · ${timeStr}` : ''}
            </span>
          )}
          {venue && <span className="text-[11px] text-dark-muted">· {venue}</span>}
          {oilProfile && (
            <Link
              href={`/oljeprofiler?q=${encodeURIComponent(oilProfile)}`}
              className="text-[11px] font-semibold text-gold no-underline"
            >
              · {oilProfile} ↗
            </Link>
          )}
        </div>
      )}

      {hasStream && isLive && (
        <div className="border-b border-red">
          {streamUrl!.includes('scoring.se') ? (
            <LiveLaneViewer
              streamUrl={streamUrl!}
              matchName={`${shortName(home.name)} vs ${shortName(away.name)}`}
            />
          ) : (
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-dark-muted">Live scoring</span>
              <a
                href={streamUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-gold no-underline"
              >
                Öppna ↗
              </a>
            </div>
          )}
        </div>
      )}
    </>
  )
}
