'use client'

import React from 'react'
import { TrendingUp } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { teamColor, teamInitials, shortName } from '@/lib/utils'
import type { Match, Player, PlayerMomentum } from '@/lib/types'

type Props = {
  teamId:         string
  completed:      Match[]
  upcoming:       Match[]
  players:        Player[]
  playerMomentum: Record<string, PlayerMomentum>
}

const W = 172  // fixed card width

export default function TeamStoryCards({ teamId, completed, upcoming, players, playerMomentum }: Props) {
  const { C, isDark } = useColors()
  const isHome = (m: Match) => m.home_team_id === teamId

  const lastMatch = completed[0] ?? null
  const nextMatch = upcoming[0]  ?? null

  const hotPlayer = [...players]
    .filter(p => playerMomentum[p.id]?.level === 'rising')
    .sort((a, b) => (playerMomentum[b.id]?.delta ?? 0) - (playerMomentum[a.id]?.delta ?? 0))[0] ?? null

  const last5     = completed.slice(0, 5)
  const formWins  = last5.filter(m => isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length

  const CardShell = ({ children }: { children: React.ReactNode }) => (
    <div
      className="flex shrink-0 flex-col rounded-2xl border p-4"
      style={{ width: W, minHeight: 148, background: C.card, borderColor: C.border }}
    >
      {children}
    </div>
  )

  const CardLabel = ({ text }: { text: string }) => (
    <p className="mb-3 text-[9px] font-black uppercase tracking-widest" style={{ color: C.muted }}>
      {text}
    </p>
  )

  const OppBadge = ({ name }: { name: string }) => {
    const tc = teamColor(name, isDark)
    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-black"
        style={{ background: tc.bg, border: '1.5px solid ' + tc.border, color: tc.text }}
      >
        {teamInitials(name)}
      </div>
    )
  }

  return (
    <div
      className="flex gap-3 overflow-x-auto px-5 pb-5 pt-1"
      style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      {/* ── Last result ──────────────────────────────────── */}
      {lastMatch && (
        <CardShell>
          <CardLabel text="Senaste match" />
          <div className="mb-3 flex items-center gap-2">
            <OppBadge name={isHome(lastMatch) ? lastMatch.away.name : lastMatch.home.name} />
            <span className="truncate text-[12px] font-bold" style={{ color: C.text }}>
              {shortName(isHome(lastMatch) ? lastMatch.away.name : lastMatch.home.name)}
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            {(() => {
              const my  = isHome(lastMatch) ? lastMatch.home_score : lastMatch.away_score
              const opp = isHome(lastMatch) ? lastMatch.away_score : lastMatch.home_score
              const won  = my !== null && opp !== null && my > opp
              const lost = my !== null && opp !== null && my < opp
              const rc   = won ? '#22c55e' : lost ? '#e05555' : '#f59e0b'
              return (
                <>
                  <span className="text-3xl font-black leading-none" style={{ color: C.text }}>
                    {my}
                    <span className="text-xl mx-1" style={{ color: C.muted }}>–</span>
                    {opp}
                  </span>
                  <span
                    className="rounded-lg px-2 py-1 text-[11px] font-black"
                    style={{ background: rc + '22', color: rc }}
                  >
                    {won ? 'V' : lost ? 'F' : 'O'}
                  </span>
                </>
              )
            })()}
          </div>
        </CardShell>
      )}

      {/* ── Next match ───────────────────────────────────── */}
      {nextMatch && (
        <CardShell>
          <CardLabel text="Nästa match" />
          <div className="mb-3 flex items-center gap-2">
            <OppBadge name={isHome(nextMatch) ? nextMatch.away.name : nextMatch.home.name} />
            <span className="truncate text-[12px] font-bold" style={{ color: C.text }}>
              {shortName(isHome(nextMatch) ? nextMatch.away.name : nextMatch.home.name)}
            </span>
          </div>
          <div className="mt-auto">
            {(() => {
              const d    = new Date(nextMatch.date)
              const days = ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag']
              const time = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
              const msLeft     = d.getTime() - Date.now()
              const hoursLeft  = Math.floor(msLeft / 3_600_000)
              const showTimer  = msLeft > 0 && hoursLeft < 48
              return (
                <>
                  <p className="text-[13px] font-bold" style={{ color: C.text }}>{days[d.getDay()]}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>{time}</p>
                  {showTimer && (
                    <p className="mt-1 text-[11px] font-bold" style={{ color: C.accent }}>
                      om {hoursLeft}h
                    </p>
                  )}
                </>
              )
            })()}
          </div>
        </CardShell>
      )}

      {/* ── Hot player OR form ───────────────────────────── */}
      {hotPlayer ? (
        <CardShell>
          <CardLabel text="I form" />
          <div className="mb-3 flex items-center gap-2">
            {(() => {
              const tc = teamColor(hotPlayer.name, isDark)
              return (
                <>
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-black"
                    style={{ background: tc.bg, border: '1.5px solid ' + tc.border, color: tc.text }}
                  >
                    {teamInitials(hotPlayer.name).slice(0, 2)}
                  </div>
                  <span className="truncate text-[12px] font-bold" style={{ color: C.text }}>
                    {hotPlayer.name.split(' ')[0]}
                  </span>
                </>
              )
            })()}
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-1">
              <TrendingUp size={12} color="#22c55e" />
              <span className="text-[22px] font-black leading-none" style={{ color: '#22c55e' }}>
                +{playerMomentum[hotPlayer.id].delta}
              </span>
            </div>
            <p className="mt-0.5 text-[10px]" style={{ color: C.muted }}>
              pins senaste 3 · snitt {playerMomentum[hotPlayer.id].seasonAvg}
            </p>
          </div>
        </CardShell>
      ) : last5.length > 0 ? (
        <CardShell>
          <CardLabel text="Form senaste 5" />
          <div className="mt-auto">
            <div className="mb-2 flex gap-1.5">
              {last5.map((m, i) => {
                const won  = isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!
                const lost = isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!
                const c    = won ? '#22c55e' : lost ? '#e05555' : '#f59e0b'
                return (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black"
                    style={{ background: c + '22', color: c }}
                  >
                    {won ? 'V' : lost ? 'F' : 'O'}
                  </div>
                )
              })}
            </div>
            <p className="text-[13px] font-bold" style={{ color: C.text }}>
              {formWins}V av {last5.length}
            </p>
          </div>
        </CardShell>
      ) : null}
    </div>
  )
}
