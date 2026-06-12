'use client'

import React from 'react'
import { Activity, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { shortName } from '@/lib/utils'
import type { Match, Player, PlayerMomentum } from '@/lib/types'

type Chip = { Icon: LucideIcon; text: string; color: string }

type Props = {
  teamId:         string
  completed:      Match[]
  upcoming:       Match[]
  players:        Player[]
  playerMomentum: Record<string, PlayerMomentum>
}

export default function TeamPulse({ teamId, completed, upcoming, players, playerMomentum }: Props) {
  const { C } = useColors()

  const isHome = (m: Match) => m.home_team_id === teamId
  const chips: Chip[] = []

  // ── Form ─────────────────────────────────────────────────────────────────
  if (completed.length > 0) {
    const last5  = completed.slice(0, 5)
    const wins   = last5.filter(m => isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length
    const losses = last5.filter(m => isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!).length

    if (losses === 0 && last5.length >= 3) {
      chips.push({ Icon: Activity, text: `${last5.length} matcher utan förlust`, color: C.green })
    } else if (wins >= 4) {
      chips.push({ Icon: Activity, text: `${wins}V av ${last5.length} senaste`,  color: C.green })
    } else if (wins >= 2) {
      chips.push({ Icon: Activity, text: `${wins}V av ${last5.length} senaste`,  color: C.muted })
    } else {
      chips.push({ Icon: Activity, text: `${wins}V av ${last5.length} senaste`,  color: '#e05555' })
    }
  }

  // ── Rising player ────────────────────────────────────────────────────────
  const hotPlayer = [...players]
    .filter(p => playerMomentum[p.id]?.level === 'rising')
    .sort((a, b) => (playerMomentum[b.id]?.delta ?? 0) - (playerMomentum[a.id]?.delta ?? 0))[0]

  if (hotPlayer) {
    const delta = playerMomentum[hotPlayer.id].delta
    chips.push({
      Icon:  TrendingUp,
      text:  `${hotPlayer.name.split(' ')[0]} +${delta} senaste 3`,
      color: C.accent,
    })
  }

  // ── Slumping player (only when no rising player to avoid double negativity) ──
  if (!hotPlayer) {
    const coldPlayer = [...players]
      .filter(p => playerMomentum[p.id]?.level === 'slumping')
      .sort((a, b) => (playerMomentum[a.id]?.delta ?? 0) - (playerMomentum[b.id]?.delta ?? 0))[0]

    if (coldPlayer) {
      const delta = playerMomentum[coldPlayer.id].delta
      chips.push({
        Icon:  TrendingDown,
        text:  `${coldPlayer.name.split(' ')[0]} ${delta} senaste 3`,
        color: '#94a3b8',
      })
    }
  }

  // ── Next match ───────────────────────────────────────────────────────────
  if (upcoming.length > 0) {
    const next = upcoming[0]
    const opp  = isHome(next) ? next.away : next.home
    const d    = new Date(next.date)
    const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
    chips.push({
      Icon:  Calendar,
      text:  `${days[d.getDay()]} vs ${shortName(opp.name)}`,
      color: C.muted,
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-4" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
      {chips.map(({ Icon, text, color }, i) => (
        <div
          key={i}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5"
          style={{ background: color + '18', borderColor: color + '44' }}
        >
          <Icon size={10} strokeWidth={2.5} style={{ color }} />
          <span className="whitespace-nowrap text-[11px] font-bold" style={{ color }}>
            {text}
          </span>
        </div>
      ))}
    </div>
  )
}
