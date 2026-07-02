'use client'

import React from 'react'
import { COLOR, SPACE, TYPE } from '@/lib/brand'
import { shortName } from '@/lib/utils'
import type { Match } from '@/lib/types'

type Props = {
  teamId:    string
  completed: Match[]
  upcoming:  Match[]
}

export default function TeamEditorialBanner({ teamId, completed, upcoming }: Props) {
  if (completed.length === 0 && upcoming.length === 0) return null

  const isHome = (m: Match) => m.home_team_id === teamId

  let winStreak = 0
  for (const m of completed) {
    const won = isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!
    if (won) winStreak++; else break
  }

  let unbeatenStreak = 0
  for (const m of completed) {
    const lost = isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!
    if (!lost) unbeatenStreak++; else break
  }

  const last5  = completed.slice(0, 5)
  const wins   = last5.filter(m => isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length
  const losses = last5.filter(m => isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!).length

  let headline = ''
  if (winStreak >= 3)           headline = `${winStreak} raka vinster`
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
    <div style={{ padding: `${SPACE[4]}px ${SPACE[4]}px ${SPACE[2]}px` }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, color: COLOR.ink }}>
        {headline}
      </h2>
      {sub.length > 0 && (
        <p style={{ margin: `${SPACE[1]}px 0 0`, fontSize: TYPE.body, color: COLOR.ink3 }}>
          {sub.join('  ·  ')}
        </p>
      )}
    </div>
  )
}
