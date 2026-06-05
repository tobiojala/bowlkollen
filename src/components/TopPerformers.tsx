'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { teamAvatarStyle, teamColors } from '@/lib/team-ui'

type Props = { teamId: string }

type PlayerStat = {
  playerId: string
  name: string
  games: number[]
  totalGames: number
  avg: number
  bestSeries: number
  over200: number
}

export default function TopPerformers({ teamId }: Props) {
  const [stats, setStats] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('match_results')
      .select('player_id, games, players:player_id(id, name)')
      .eq('team_id', teamId)
      .not('games', 'is', null)
      .then(({ data }) => {
        if (!data) {
          setLoading(false)
          return
        }

        type ResultRow = { player_id: string; games: number[]; players?: { name: string } }
        const rows = data as unknown as ResultRow[]

        const byPlayer: Record<string, { name: string; allGames: number[] }> = {}
        rows.forEach(r => {
          const pid = r.player_id
          if (!pid || !r.players) return
          if (!byPlayer[pid]) byPlayer[pid] = { name: r.players.name, allGames: [] }
          const games = (r.games || []).filter((g: number) => g > 0)
          byPlayer[pid].allGames.push(...games)
        })

        const playerStats: PlayerStat[] = Object.entries(byPlayer)
          .filter(([, p]) => p.allGames.length > 0)
          .map(([pid, p]) => {
            const allGames = p.allGames
            const totalGames = allGames.length
            const avg = Math.round(allGames.reduce((a, b) => a + b, 0) / totalGames)

            const seriesList: number[] = []
            rows
              .filter(r => r.player_id === pid)
              .forEach(r => {
                const games = (r.games || []).filter((g: number) => g > 0)
                if (games.length > 0) seriesList.push(games.reduce((a, b) => a + b, 0))
              })
            const bestSeries = seriesList.length > 0 ? Math.max(...seriesList) : 0
            const over200 = allGames.filter(g => g >= 200).length

            return { playerId: pid, name: p.name, games: allGames, totalGames, avg, bestSeries, over200 }
          })
          .filter(p => p.totalGames >= 2)

        setStats(playerStats)
        setLoading(false)
      })
  }, [teamId])

  if (loading || stats.length === 0) return null

  const bestAvg = [...stats].sort((a, b) => b.avg - a.avg)[0]
  const bestSeries = [...stats].sort((a, b) => b.bestSeries - a.bestSeries)[0]
  const most200 = [...stats].sort((a, b) => b.over200 - a.over200)[0]

  const cards = [
    { label: 'Hogst snitt', player: bestAvg, value: bestAvg?.avg, unit: 'per spel', icon: '📈' },
    { label: 'Basta serie', player: bestSeries, value: bestSeries?.bestSeries, unit: 'pins', icon: '🎯' },
    { label: 'Mest 200+', player: most200, value: most200?.over200, unit: 'spel', icon: '⭐' },
  ]

  return (
    <div className="border-t border-light-border dark:border-dark-border">
      <div className="px-5 pt-3.5 pb-2.5 text-[10px] font-extrabold tracking-[2px] text-dark-muted">
        TOPPRESTATIONER
      </div>
      <div className="grid grid-cols-3 gap-2 px-5 pb-4">
        {cards.map(card => {
          if (!card.player) return null
          const light = teamColors(card.player.name, false)
          const dark = teamColors(card.player.name, true)
          const ini = card.player.name
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <a
              key={card.label}
              href={'/players/' + card.player.playerId}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-2.5 text-center no-underline',
                'border-light-border bg-light-card transition-colors',
                'hover:bg-light-surface dark:border-dark-border dark:bg-dark-card dark:hover:bg-dark-surface',
                '[-webkit-tap-highlight-color:transparent]',
              )}
            >
              <div className="text-[9px] font-extrabold tracking-wide text-dark-muted">
                {card.label.toUpperCase()}
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold dark:hidden"
                style={teamAvatarStyle(light.accent, light.bg)}
              >
                {ini}
              </div>
              <div
                className="hidden h-9 w-9 items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold dark:flex"
                style={teamAvatarStyle(dark.accent, dark.bg)}
              >
                {ini}
              </div>
              <div className="w-full truncate text-[11px] leading-tight font-semibold bk-text-primary">
                {card.player.name.split(' ')[0]}
              </div>
              <div>
                <div className="text-xl leading-none font-black text-gold">{card.value}</div>
                <div className="mt-0.5 text-[9px] text-dark-muted">{card.unit.toUpperCase()}</div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
