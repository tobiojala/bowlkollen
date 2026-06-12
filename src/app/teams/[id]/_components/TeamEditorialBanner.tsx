'use client'

import React from 'react'
import { useColors } from '@/components/ThemeProvider'
import { shortName } from '@/lib/utils'
import type { Match } from '@/lib/types'

type Props = {
  teamId:    string
  completed: Match[]
  upcoming:  Match[]
}

export default function TeamEditorialBanner({ teamId, completed, upcoming }: Props) {
  const { C } = useColors()

  if (completed.length === 0 && upcoming.length === 0) return null

  const isHome = (m: Match) => m.home_team_id === teamId

  // Win streak
  let winStreak = 0
  for (const m of completed) {
    const won = isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!
    if (won) winStreak++; else break
  }

  // Unbeaten streak
  let unbeatenStreak = 0
  for (const m of completed) {
    const lost = isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!
    if (!lost) unbeatenStreak++; else break
  }

  const last5   = completed.slice(0, 5)
  const wins    = last5.filter(m => isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length
  const losses  = last5.filter(m => isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!).length

  let headline = ''
  if (winStreak >= 3)          headline = `${winStreak} raka vinster`
  else if (unbeatenStreak >= 4) headline = `${unbeatenStreak} matcher utan förlust`
  else if (wins >= 4)           headline = `${wins}V av ${last5.length} senaste`
  else if (losses >= 4)         headline = `Tufft — ${losses} av ${last5.length} förlorade`
  else if (completed.length > 0) headline = `${wins}V av ${last5.length} senaste`

  if (!headline) return null

  const division = completed[0]?.division ?? upcoming[0]?.division ?? null
  const sub: string[] = []
  if (division) sub.push(division)
  if (upcoming.length > 0) {
    const next = upcoming[0]
    const opp  = isHome(next) ? next.away : next.home
    const d    = new Date(next.date)
    const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
    sub.push(`Nästa: ${days[d.getDay()]} vs ${shortName(opp.name)}`)
  }

  return (
    <div className="px-5 pt-5 pb-2">
      <h2 className="text-2xl font-black tracking-tight leading-tight" style={{ color: C.text }}>
        {headline}
      </h2>
      {sub.length > 0 && (
        <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
          {sub.join('  ·  ')}
        </p>
      )}
    </div>
  )
}
