'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { ComparePageSkeleton } from '@/components/compare/ComparePageSkeleton'
import { CompareBackLink } from '@/components/compare/CompareBackLink'
import { CompareSplitHero } from '@/components/compare/CompareSplitHero'
import { TeamCompareResults } from '@/components/compare/TeamCompareResults'
import {
  computeTeamCompareStats,
  countMetricWins,
  type TeamCompareMatch,
  type TeamCompareStats,
} from '@/lib/compare-ui'

type Props = { params: Promise<{ id1: string; id2: string }> }
type Team = { id: string; name: string; city: string | null }

export default function TeamComparePage({ params }: Props) {
  const [ids, setIds] = useState<{ id1: string; id2: string } | null>(null)
  const [t1, setT1] = useState<Team | null>(null)
  const [t2, setT2] = useState<Team | null>(null)
  const [stats1, setStats1] = useState<TeamCompareStats | null>(null)
  const [stats2, setStats2] = useState<TeamCompareStats | null>(null)
  const [h2h, setH2h] = useState<TeamCompareMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setIds(p))
  }, [params])

  useEffect(() => {
    if (!ids) return
    const supabase = createClient()
    Promise.all([
      supabase.from('teams').select('id,name,city').eq('id', ids.id1).single(),
      supabase.from('teams').select('id,name,city').eq('id', ids.id2).single(),
      supabase
        .from('matches')
        .select(
          'id,date,status,home_score,away_score,home_team_id,away_team_id,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)',
        )
        .eq('status', 'completed')
        .or(`home_team_id.eq.${ids.id1},away_team_id.eq.${ids.id1}`),
      supabase
        .from('matches')
        .select(
          'id,date,status,home_score,away_score,home_team_id,away_team_id,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)',
        )
        .eq('status', 'completed')
        .or(`home_team_id.eq.${ids.id2},away_team_id.eq.${ids.id2}`),
      supabase
        .from('matches')
        .select(
          'id,date,home_score,away_score,home_team_id,away_team_id,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)',
        )
        .not('home_score', 'is', null)
        .or(
          `and(home_team_id.eq.${ids.id1},away_team_id.eq.${ids.id2}),and(home_team_id.eq.${ids.id2},away_team_id.eq.${ids.id1})`,
        )
        .order('date', { ascending: false })
        .limit(10),
    ]).then(([{ data: team1 }, { data: team2 }, { data: m1 }, { data: m2 }, { data: h2hData }]) => {
      if (team1) setT1(team1 as Team)
      if (team2) setT2(team2 as Team)
      setStats1(m1 ? computeTeamCompareStats(m1 as TeamCompareMatch[], ids.id1) : null)
      setStats2(m2 ? computeTeamCompareStats(m2 as TeamCompareMatch[], ids.id2) : null)
      setH2h((h2hData || []) as TeamCompareMatch[])
      setLoading(false)
    })
  }, [ids])

  if (loading) return <ComparePageSkeleton label="Laddar jämförelse..." />

  if (!t1 || !t2 || !stats1 || !stats2 || !ids) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg font-sans dark:bg-dark-bg">
        <p className="text-dark-muted">Lag hittades inte</p>
      </main>
    )
  }

  const { overall } = countMetricWins(stats1, stats2)

  return (
    <main className="min-h-screen bg-light-bg font-sans text-light-text dark:bg-dark-bg dark:text-dark-text">
      <CompareBackLink href="/teams">← Alla lag</CompareBackLink>

      <CompareSplitHero
        nameLayout="split"
        team1={{
          name: t1.name,
          city: t1.city,
          href: `/teams/${t1.id}`,
          isFavorite: overall === 1,
        }}
        team2={{
          name: t2.name,
          city: t2.city,
          href: `/teams/${t2.id}`,
          isFavorite: overall === 2,
        }}
      />

      <TeamCompareResults
        t1={t1}
        t2={t2}
        stats1={stats1}
        stats2={stats2}
        h2h={h2h}
        id1={ids.id1}
        id2={ids.id2}
      />
    </main>
  )
}
