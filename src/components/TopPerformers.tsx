'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName } from '@/lib/utils'

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
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [stats, setStats] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('match_results')
      .select('player_id, games, players:player_id(id, name)')
      .eq('team_id', teamId)
      .not('games', 'is', null)
      .then(({ data }) => {
        if (!data) { setLoading(false); return }

        // Group by player
        const byPlayer: Record<string, { name: string; allGames: number[] }> = {}
        data.forEach((r: any) => {
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

            // Best series = best 4-game block
            const seriesList: number[] = []
            data.filter((r: any) => r.player_id === pid).forEach((r: any) => {
              const games = (r.games || []).filter((g: number) => g > 0)
              if (games.length > 0) seriesList.push(games.reduce((a: number, b: number) => a + b, 0))
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
    <div style={{ borderTop: '1px solid ' + C.border }}>
      <div style={{ padding: '14px 20px 10px', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2 }}>
        TOPPRESTATIONER
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 20px 16px' }}>
        {cards.map(card => {
          if (!card.player) return null
          const hue = card.player.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
          const tc = 'hsl(' + hue + ',50%,45%)'
          const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
          const ini = card.player.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

          return (
            <a key={card.label} href={'/players/' + card.player.playerId}
              style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '12px 10px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
              onMouseLeave={e => (e.currentTarget.style.background = C.card)}
            >
              <div style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1 }}>
                {card.label.toUpperCase()}
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc }}>
                {ini}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {card.player.name.split(' ')[0]}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{card.unit.toUpperCase()}</div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
