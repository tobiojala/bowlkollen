'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { ComparePageSkeleton } from '@/components/compare/ComparePageSkeleton'
import { CompareBackLink } from '@/components/compare/CompareBackLink'
import { PlayerCompareHero } from '@/components/compare/PlayerCompareHero'
import { PlayerCompareResults } from '@/components/compare/PlayerCompareResults'
import {
  computePlayerCompareStats,
  countPlayerMetricWins,
  type PlayerCompareRow,
  type PlayerCompareStats,
} from '@/lib/compare-ui'

type Props = { params: Promise<{ id1: string; id2: string }> }

type Player = {
  id: string
  name: string
  team_id: string | null
  avatar_url: string | null
}

export default function ComparePage({ params }: Props) {
  const [ids, setIds] = useState<{ id1: string; id2: string } | null>(null)
  const [p1, setP1] = useState<Player | null>(null)
  const [p2, setP2] = useState<Player | null>(null)
  const [team1, setTeam1] = useState<{ name: string } | null>(null)
  const [team2, setTeam2] = useState<{ name: string } | null>(null)
  const [stats1, setStats1] = useState<PlayerCompareStats | null>(null)
  const [stats2, setStats2] = useState<PlayerCompareStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setIds(p))
  }, [params])

  useEffect(() => {
    if (!ids) return
    const supabase = createClient()
    Promise.all([
      supabase.from('players').select('id,name,team_id,avatar_url').eq('id', ids.id1).single(),
      supabase.from('players').select('id,name,team_id,avatar_url').eq('id', ids.id2).single(),
      supabase.from('match_results').select('games').eq('player_id', ids.id1),
      supabase.from('match_results').select('games').eq('player_id', ids.id2),
    ]).then(async ([{ data: player1 }, { data: player2 }, { data: r1 }, { data: r2 }]) => {
      if (player1) {
        setP1(player1 as Player)
        if (player1.team_id) {
          const { data: t } = await supabase
            .from('teams')
            .select('name')
            .eq('id', player1.team_id)
            .single()
          if (t) setTeam1(t)
        }
      }
      if (player2) {
        setP2(player2 as Player)
        if (player2.team_id) {
          const { data: t } = await supabase
            .from('teams')
            .select('name')
            .eq('id', player2.team_id)
            .single()
          if (t) setTeam2(t)
        }
      }
      setStats1(r1 ? computePlayerCompareStats(r1 as PlayerCompareRow[]) : null)
      setStats2(r2 ? computePlayerCompareStats(r2 as PlayerCompareRow[]) : null)
      setLoading(false)
    })
  }, [ids])

  if (loading) return <ComparePageSkeleton label="Laddar jämförelse..." />

  if (!p1 || !p2 || !stats1 || !stats2) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
        <p className="text-dark-muted">Spelare hittades inte</p>
      </main>
    )
  }

  const { overall } = countPlayerMetricWins(stats1, stats2)

  return (
    <main className="min-h-screen bg-light-bg font-sans text-light-text dark:bg-dark-bg dark:text-dark-text">
      <CompareBackLink href="/players">← Tillbaka</CompareBackLink>

      <PlayerCompareHero
        player1={{
          player: p1,
          teamName: team1?.name,
          href: `/players/${p1.id}`,
          isWinner: overall === 1,
        }}
        player2={{
          player: p2,
          teamName: team2?.name,
          href: `/players/${p2.id}`,
          isWinner: overall === 2,
        }}
      />

      <PlayerCompareResults p1={p1} p2={p2} stats1={stats1} stats2={stats2} />
    </main>
  )
}
