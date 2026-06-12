'use client'

import React from 'react'
import { useColors } from '@/components/ThemeProvider'
import TeamEditorialBanner from './TeamEditorialBanner'
import TeamSeasonArc       from './TeamSeasonArc'
import TeamStoryCards      from './TeamStoryCards'
import type { Match, Player, PlayerMomentum } from '@/lib/types'

type Props = {
  id:             string
  matches:        Match[]
  players:        Player[]
  playerMomentum: Record<string, PlayerMomentum>
}

export default function TeamOverview({ id, matches, players, playerMomentum }: Props) {
  const { C } = useColors()

  const completed = matches.filter(m => m.status === 'completed' && m.home_score !== null)
  const upcoming  = matches.filter(m => m.status === 'upcoming'  || m.status === 'live')

  return (
    <section
      id="team-overview"
      className="pb-2"
      style={{ scrollMarginTop: 60, borderBottom: '1px solid ' + C.border }}
    >
      <TeamEditorialBanner teamId={id} completed={completed} upcoming={upcoming} />
      <TeamSeasonArc       teamId={id} matches={matches} />
      <TeamStoryCards      teamId={id} completed={completed} upcoming={upcoming} players={players} playerMomentum={playerMomentum} />
    </section>
  )
}
