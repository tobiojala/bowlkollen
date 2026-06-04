'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { ScoreChip } from '@/components/matches/ScoreChip'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const
const SERIE_TABS = ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Totalt']

type Lineup = { team_id: string; bord: number; position: number; player_name: string }

type Props = {
  homeTeamId: string
  awayTeamId: string
  homeName: string
  awayName: string
  lineup: Lineup[]
  activeSerie: number
  onSerieChange: (i: number) => void
  serieSummary: { gi: number; h: number; a: number }[]
  getScore: (teamId: string, bord: number, pos: number) => number
  playerIds: Record<string, string>
  matchLabel: string
  dark: boolean
}

function PlayerName({
  name,
  playerId,
  wins,
  align,
}: {
  name?: string
  playerId: string | null
  wins: boolean
  align: 'left' | 'right'
}) {
  const className = cn(
    'max-w-full truncate text-[11px] no-underline',
    align === 'right' && 'text-right',
    wins ? 'font-bold' : 'font-medium',
    playerId ? 'text-gold' : wins ? 'bk-text-primary' : 'text-dark-muted',
  )
  if (playerId && name) {
    return (
      <Link href={`/players/${playerId}`} className={className}>
        {name}
      </Link>
    )
  }
  return <span className={className}>{name || '—'}</span>
}

export function MatchScorecard({
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  lineup,
  activeSerie,
  onSerieChange,
  serieSummary,
  getScore,
  playerIds,
  matchLabel,
  dark,
}: Props) {
  return (
    <>
      <div className="sticky top-14 z-30 border-b border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
        <div className="flex gap-0.5 overflow-x-auto px-2.5 py-1.5 [scrollbar-width:none]">
          {SERIE_TABS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => onSerieChange(i)}
              className={cn(
                'relative shrink-0 cursor-pointer rounded-[10px] border-none bg-transparent px-[13px] py-[7px] text-xs font-bold [-webkit-tap-highlight-color:transparent]',
                activeSerie === i ? 'text-gold' : 'text-dark-muted',
              )}
            >
              {activeSerie === i && (
                <motion.div
                  layoutId="serie-tab-capsule"
                  transition={SPRING}
                  className={cn(
                    'absolute inset-x-0 inset-y-[3px] rounded-[10px] border border-gold/22',
                    dark ? 'bg-gold/10' : 'bg-gold/8',
                  )}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {serieSummary.length > 0 && (
        <div className="flex border-b border-light-border dark:border-dark-border">
          {serieSummary.map(({ gi, h, a }) => {
            const hW = h > a
            const aW = a > h
            const isTab = gi === activeSerie
            return (
              <button
                key={gi}
                type="button"
                onClick={() => onSerieChange(gi)}
                className={cn(
                  'flex-1 cursor-pointer border-none px-1 pt-2.5 pb-2 [-webkit-tap-highlight-color:transparent]',
                  isTab ? 'border-b-2 border-gold bg-gold/6 dark:bg-gold/6' : 'border-b-2 border-transparent bg-transparent',
                )}
              >
                <div
                  className={cn(
                    'mb-1 text-[8px] font-extrabold tracking-wide',
                    isTab ? 'text-gold' : 'text-dark-muted',
                  )}
                >
                  S{gi + 1}
                </div>
                <div className={cn('text-xs font-bold leading-none', hW ? 'text-gold' : 'bk-text-primary')}>
                  {h}
                </div>
                <div className="my-0.5 text-[9px] text-dark-muted">–</div>
                <div className={cn('text-xs font-bold leading-none', aW ? 'text-gold' : 'bk-text-primary')}>
                  {a}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-[1fr_1px_1fr] px-3 pt-2.5 pb-1">
        <div className="pr-3.5 text-right">
          <span className="text-[9px] font-extrabold tracking-wide text-dark-muted">
            {shortName(homeName).toUpperCase()}
          </span>
        </div>
        <div />
        <div className="pl-3.5">
          <span className="text-[9px] font-extrabold tracking-wide text-dark-muted">
            {shortName(awayName).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-3 pb-2">
        {[1, 2, 3, 4].map(bord => {
          const homeP = [1, 2].map(pos => ({
            player: lineup.find(l => l.team_id === homeTeamId && l.bord === bord && l.position === pos),
            score: getScore(homeTeamId, bord, pos),
          }))
          const awayP = [1, 2].map(pos => ({
            player: lineup.find(l => l.team_id === awayTeamId && l.bord === bord && l.position === pos),
            score: getScore(awayTeamId, bord, pos),
          }))

          const hasAny = homeP.some(p => p.player) || awayP.some(p => p.player)
          if (!hasAny) return null

          const homeSubtotal = homeP.reduce((s, p) => s + p.score, 0)
          const awaySubtotal = awayP.reduce((s, p) => s + p.score, 0)
          const homeWinsHere = homeSubtotal > 0 && homeSubtotal > awaySubtotal
          const awayWinsHere = awaySubtotal > 0 && awaySubtotal > homeSubtotal

          return (
            <div
              key={bord}
              className="overflow-hidden rounded-[18px] border border-light-border bg-light-card dark:border-dark-border dark:bg-white/[0.035]"
            >
              <div className="flex items-center justify-between border-b border-light-border bg-black/[0.02] px-3.5 py-2 dark:border-dark-border dark:bg-white/[0.025]">
                <span className="text-[10px] font-extrabold tracking-wide text-dark-muted">
                  BANPAR {bord}
                </span>
                {homeSubtotal > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[13px] font-extrabold', homeWinsHere && 'text-gold')}>
                      {homeSubtotal}
                    </span>
                    <span className="text-[10px] text-dark-muted">–</span>
                    <span className={cn('text-[13px] font-extrabold', awayWinsHere && 'text-gold')}>
                      {awaySubtotal}
                    </span>
                  </div>
                )}
              </div>

              {[0, 1].map(posIdx => {
                const hp = homeP[posIdx]
                const ap = awayP[posIdx]
                const hWins = hp.score > 0 && ap.score > 0 && hp.score > ap.score
                const aWins = ap.score > 0 && hp.score > 0 && ap.score > hp.score
                const hpName = hp.player?.player_name
                const apName = ap.player?.player_name

                return (
                  <div
                    key={posIdx}
                    className={cn(
                      'grid grid-cols-[1fr_1px_1fr]',
                      posIdx === 0 && 'border-b border-black/5 dark:border-white/5',
                    )}
                  >
                    <div className="flex flex-col items-end gap-1 px-3.5 py-3">
                      <PlayerName
                        name={hpName}
                        playerId={hpName ? playerIds[hpName] ?? null : null}
                        wins={hWins}
                        align="right"
                      />
                      <ScoreChip
                        score={hp.score}
                        shareData={
                          hp.score >= 220 && hpName
                            ? { playerName: hpName, matchLabel }
                            : undefined
                        }
                      />
                    </div>
                    <div className="bg-black/5 dark:bg-white/5" />
                    <div className="flex flex-col items-start gap-1 px-3.5 py-3">
                      <PlayerName
                        name={apName}
                        playerId={apName ? playerIds[apName] ?? null : null}
                        wins={aWins}
                        align="left"
                      />
                      <ScoreChip
                        score={ap.score}
                        shareData={
                          ap.score >= 220 && apName
                            ? { playerName: apName, matchLabel }
                            : undefined
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}
