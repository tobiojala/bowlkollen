'use client'

import { cn } from '@/lib/cn'
import { shortDiv, shortName } from '@/lib/utils'
import {
  teamZoneAccent,
  teamZoneAccentStyle,
  teamZoneDotStyle,
  teamZoneGradientBarStyle,
  teamZoneProgressWidth,
  teamZoneRelegationBarStyle,
  teamZoneTone,
  teamZoneTopBarStyle,
} from '@/lib/home-ui'

export type ZoneTableRow = {
  rank: number
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  points: number
}

export type DivisionZoneConfig = {
  promotionRanks?: number
  playoffRanks?: number
  relegationRanks: number
  totalGames: number
}

type Props = {
  teamName: string
  teamId: string
  division: string
  table: ZoneTableRow[]
  zones: DivisionZoneConfig
  nextOpponentName?: string | null
}

export function TeamZoneCard({
  teamName,
  teamId,
  division,
  table,
  zones,
  nextOpponentName,
}: Props) {
  const myRow = table.find(r => r.teamId === teamId)
  if (!myRow) return null

  const { rank, points, played } = myRow
  const total = table.length
  const gamesLeft = zones.totalGames - played

  const topZoneRank = zones.promotionRanks ?? zones.playoffRanks ?? 0
  const botZoneRank = total - zones.relegationRanks + 1
  const inTopZone = rank <= topZoneRank
  const inBotZone = rank >= botZoneRank
  const tone = teamZoneTone(inTopZone, inBotZone)
  const accentClr = teamZoneAccent(tone)

  const topBoundaryPts = topZoneRank > 0 ? (table[topZoneRank - 1]?.points ?? points) : points
  const botBoundaryPts = table[botZoneRank - 1]?.points ?? 0
  const toTopZone = Math.max(0, topBoundaryPts - points + 1)
  const toBotZone = Math.max(0, points - botBoundaryPts)
  const rankAbovePts = rank > 1 ? (table[rank - 2]?.points ?? points) : points
  const toClimb = Math.max(0, rankAbovePts - points + 1)

  const topLabel = zones.promotionRanks ? 'Uppflyttning' : 'SM-slutspel'
  const topLabelSh = zones.promotionRanks ? 'Uppflyttning' : 'Slutspel'

  const dotPct = total > 1 ? ((rank - 1) / (total - 1)) * 100 : 50

  const borderClr =
    tone === 'top' ? 'border-gold/30' : tone === 'bot' ? 'border-red/30' : 'border-[#38a088]/30'
  const bgGradient =
    tone === 'top'
      ? 'from-gold/7 via-transparent'
      : tone === 'bot'
        ? 'from-red/8 via-transparent'
        : 'from-[#38a088]/8 via-transparent'

  const topProgressPct = Math.max(5, 100 - (toTopZone / Math.max(gamesLeft * 2, 1)) * 100)
  const botProgressPct = Math.min(100, (toBotZone / Math.max(gamesLeft * 2, 1)) * 100)

  return (
    <div className="px-4 pt-4">
      <div
        className={cn(
          'overflow-hidden rounded-2xl border bg-linear-to-br to-light-bg dark:to-dark-bg',
          borderClr,
          bgGradient,
        )}
      >
        <div className="h-[3px]" style={teamZoneTopBarStyle(accentClr)} />
        <div className="px-4 py-3.5 pb-4">
          <div className="mb-3.5 flex items-center gap-1.5">
            <span className="flex-1 text-[9px] font-extrabold tracking-wide" style={teamZoneAccentStyle(accentClr)}>
              VAD BEHÖVER MITT LAG
            </span>
            <span className="rounded bg-black/6 px-2 py-[3px] text-[9px] font-bold tracking-wide text-dark-muted dark:bg-white/7">
              {shortDiv(division)}
            </span>
          </div>

          <div className="mb-4 flex items-end gap-2.5">
            <div>
              <div className="text-[17px] font-extrabold leading-tight bk-text-primary">{teamName}</div>
              <div className="mt-0.5 text-[10px] text-dark-muted">
                {played} matcher spelade · {gamesLeft} kvar
              </div>
            </div>
            <div className="ml-auto shrink-0 text-right">
              <div className="text-[9px] tracking-wide text-dark-muted">PLATS</div>
              <div
                className="text-[32px] leading-none font-black tabular-nums"
                style={teamZoneAccentStyle(accentClr)}
              >
                {rank}
              </div>
              <div className="text-[11px] text-dark-muted tabular-nums">{points}p</div>
            </div>
          </div>

          <div className="mb-3.5">
            <div
              className="h-2.5 rounded-full opacity-35"
              style={teamZoneGradientBarStyle(topZoneRank, total, botZoneRank)}
            />
            <div className="relative -mt-2.5 h-2.5">
              <div
                className="absolute top-[-3px] h-3.5 w-3.5 rounded-full border-2 border-light-bg dark:border-dark-bg"
                style={teamZoneDotStyle(accentClr, dotPct)}
              />
            </div>
            <div className="mt-2.5 flex justify-between">
              <span className="text-[8px] font-bold tracking-wide text-gold">{topLabelSh}</span>
              <span className="text-[8px] font-bold tracking-wide text-red">Nedflyttning</span>
            </div>
          </div>

          <div className="flex flex-col gap-[7px] border-t border-light-border pt-3 dark:border-dark-border">
            {!inTopZone && toTopZone > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px]">↑</span>
                <span className="text-[11px] font-bold text-gold">
                  {toTopZone}p till {topLabel.toLowerCase()}
                </span>
                <div className="h-[3px] flex-1 overflow-hidden rounded-sm bg-black/8 dark:bg-white/8">
                  <div className="h-full rounded-sm bg-gold" style={teamZoneProgressWidth(topProgressPct)} />
                </div>
              </div>
            )}
            {inTopZone && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">✓</span>
                <span className="text-[11px] font-bold text-gold">
                  I {topLabel.toLowerCase()}-zonen ·{' '}
                  {toClimb > 0 ? `${toClimb}p till plats ${rank - 1}` : 'Ledande laget'}
                </span>
              </div>
            )}
            {!inBotZone && (
              <div className="flex items-center gap-2">
                <span className="text-[10px]">↓</span>
                <span
                  className={cn(
                    'text-[11px] font-semibold',
                    toBotZone <= 3 ? 'text-red' : 'text-dark-muted',
                  )}
                >
                  {toBotZone}p {toBotZone <= 3 ? 'till nedflyttning' : 'över nedflyttning'}
                </span>
                <div className="h-[3px] flex-1 overflow-hidden rounded-sm bg-black/8 dark:bg-white/8">
                  <div
                    className={cn('h-full rounded-sm', toBotZone > 3 && 'bg-dark-muted/30')}
                    style={teamZoneRelegationBarStyle(toBotZone, botProgressPct)}
                  />
                </div>
              </div>
            )}
            {inBotZone && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">!</span>
                <span className="text-[11px] font-bold text-red">
                  I nedflyttnings-zonen · {toClimb}p till plats {rank - 1}
                </span>
              </div>
            )}
            <p className="text-[10px] text-dark-muted">
              {gamesLeft} matcher kvar · max ~{gamesLeft * 2}p möjliga
            </p>
          </div>

          {nextOpponentName && gamesLeft > 0 && (
            <p className="mt-3 border-t border-light-border pt-3 text-[10px] leading-snug text-dark-muted dark:border-dark-border">
              <span className="font-bold" style={teamZoneAccentStyle(accentClr)}>
                Nästa match
              </span>{' '}
              mot {shortName(nextOpponentName)} — vinst ger 2p
              {!inTopZone && toTopZone <= 2 && (
                <span className="font-bold text-gold"> · räcker till {topLabel.toLowerCase()}!</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
