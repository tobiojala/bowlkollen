'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { formResultColor, teamAvatarStyle, teamColors } from '@/lib/team-ui'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

type H2HMatch = {
  id: string
  date: string
  home_score: number | null
  away_score: number | null
  home_team_id?: string
  away_team_id?: string
}

export type H2HOpponent = {
  team: { name: string }
  oppId: string
  matches: H2HMatch[]
  w: number
  d: number
  l: number
}

type Props = {
  teamId: string
  opponents: H2HOpponent[]
  expandedOppId: string | null
  onToggleExpand: (oppId: string | null) => void
  dark: boolean
}

export function TeamH2HTab({
  teamId,
  opponents,
  expandedOppId,
  onToggleExpand,
  dark,
}: Props) {
  const isHome = (m: H2HMatch) => m.home_team_id === teamId
  return (
    <div>
      <div className="flex items-center justify-between border-b border-light-border px-5 py-3 dark:border-dark-border">
        <span className="text-[10px] font-extrabold tracking-widest text-dark-muted">
          {opponents.length > 0 ? `${opponents.length} MOTSTÅNDARE` : 'TIDIGARE MÖTEN'}
        </span>
        <Link
          href="/teams"
          className="rounded-lg border border-gold/45 bg-gold/15 px-3 py-[5px] text-[11px] font-bold text-gold no-underline"
        >
          Hitta ett lag →
        </Link>
      </div>

      {opponents.length === 0 ? (
        <p className="px-6 py-12 text-center text-[13px] text-dark-muted">
          Inga spelade matcher registrerade ännu
        </p>
      ) : (
        opponents.map(opp => {
          const isExp = expandedOppId === opp.oppId
          const { accent: oppTc, bg: oppTclo } = teamColors(opp.team?.name || '', dark)
          const oppIni = shortName(opp.team?.name || '')
            .split(' ')
            .map(w => w[0])
            .join('')
            .slice(0, 3)
            .toUpperCase()
          const total = opp.matches.length
          const winPct = total > 0 ? Math.round((opp.w / total) * 100) : 0

          return (
            <div key={opp.oppId} className="border-b border-light-border dark:border-dark-border">
              <button
                type="button"
                onClick={() => onToggleExpand(isExp ? null : opp.oppId)}
                className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left [-webkit-tap-highlight-color:transparent]"
              >
                <div
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-[10px] font-extrabold"
                  style={teamAvatarStyle(oppTc, oppTclo)}
                >
                  {oppIni}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold bk-text-primary">
                    {shortName(opp.team?.name || '')}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs font-extrabold text-green">{opp.w}V</span>
                    <span className="text-xs font-extrabold text-dark-muted">{opp.d}O</span>
                    <span className="text-xs font-extrabold text-red">{opp.l}F</span>
                    <span className="text-[10px] text-dark-muted">
                      · {total} matcher · {winPct}% vunna
                    </span>
                  </div>
                </div>

                <Link
                  href={`/compare/teams/${teamId}/${opp.oppId}`}
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 whitespace-nowrap rounded-lg border border-gold/45 bg-gold/15 px-2.5 py-[5px] text-[11px] font-bold text-gold no-underline"
                >
                  Jämför →
                </Link>

                <motion.span
                  animate={{ rotate: isExp ? 90 : 0 }}
                  transition={SPRING}
                  className="shrink-0 text-lg leading-none text-dark-muted"
                >
                  ›
                </motion.span>
              </button>

              <motion.div
                initial={false}
                animate={{ height: isExp ? 'auto' : 0, opacity: isExp ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className={cn(dark ? 'bg-white/[0.02]' : 'bg-black/[0.02]')}>
                  {[...opp.matches]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((m, mi) => {
                      const home = isHome(m)
                      const myScore = home ? m.home_score : m.away_score
                      const thScore = home ? m.away_score : m.home_score
                      const won = myScore !== null && thScore !== null && myScore! > thScore!
                      const lost = myScore !== null && thScore !== null && myScore! < thScore!
                      const drew = myScore !== null && thScore !== null && myScore === thScore
                      const label = won ? 'V' : lost ? 'F' : drew ? 'O' : null
                      const lColor = label ? formResultColor(label) : '#6b7a99'
                      const dateStr = m.date
                        ? new Date(m.date).toLocaleDateString('sv-SE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''

                      return (
                        <Link
                          key={m.id}
                          href={`/matches/${m.id}`}
                          className={cn(
                            'flex items-center gap-2.5 py-2.5 pr-5 pl-7 no-underline',
                            mi === 0
                              ? 'border-t border-light-border dark:border-dark-border'
                              : 'border-t border-black/5 dark:border-white/5',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold',
                              !label && 'border border-light-border bg-light-card text-dark-muted dark:border-dark-border dark:bg-dark-card',
                            )}
                            style={
                              label
                                ? {
                                    background: `${lColor}22`,
                                    border: `1px solid ${lColor}`,
                                    color: lColor,
                                  }
                                : undefined
                            }
                          >
                            {label || '—'}
                          </div>
                          <div className="flex-1 text-xs text-dark-muted">
                            {dateStr} · {home ? 'Hemma' : 'Borta'}
                          </div>
                          {myScore !== null && (
                            <div
                              className={cn(
                                'text-[13px] font-extrabold tabular-nums',
                                won ? 'text-gold' : 'bk-text-primary',
                              )}
                            >
                              {myScore} – {thScore}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                </div>
              </motion.div>
            </div>
          )
        })
      )}
    </div>
  )
}
