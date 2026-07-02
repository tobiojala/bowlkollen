import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/query-client'
import { createPublicSupabase } from '@/lib/supabase-public'
import { SEASON } from '@/lib/constants'
import PredictionClient from './_components/PredictionClient'

export const revalidate = 60

export type LeaderboardEntry = {
  userId: string
  name: string
  avatarUrl: string | null
  correct: number
  total: number
  pct: number
}

export type UpcomingMatch = {
  id: string
  date: string
  division: string
  home: { id: string; name: string }
  away: { id: string; name: string }
}

async function buildLeaderboard(pub: ReturnType<typeof createPublicSupabase>): Promise<LeaderboardEntry[]> {
  const { data: matches } = await pub
    .from('matches')
    .select('id,home_score,away_score')
    .eq('status', 'completed')
    .gte('date', SEASON.CURRENT)
    .not('home_score', 'is', null)

  if (!matches?.length) return []

  const matchIds = matches.map(m => m.id)
  const { data: predictions } = await pub
    .from('match_predictions')
    .select('match_id,user_id,prediction')
    .in('match_id', matchIds)

  if (!predictions?.length) return []

  const scoreMap: Record<string, { correct: number; total: number }> = {}
  for (const pred of predictions) {
    const match = matches.find(m => m.id === pred.match_id)
    if (!match) continue
    const hs = match.home_score!, as = match.away_score!
    const correct = hs > as ? 'W' : as > hs ? 'L' : null
    if (!correct) continue

    scoreMap[pred.user_id] ??= { correct: 0, total: 0 }
    scoreMap[pred.user_id].total++
    if (pred.prediction === correct) scoreMap[pred.user_id].correct++
  }

  const topIds = Object.entries(scoreMap)
    .filter(([, s]) => s.total >= 2)
    .sort((a, b) => b[1].correct - a[1].correct || (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
    .slice(0, 25)
    .map(([uid]) => uid)

  if (!topIds.length) return []

  const { data: profiles } = await pub
    .from('profiles')
    .select('id,full_name,avatar_url')
    .in('id', topIds)

  return topIds.map(uid => {
    const s = scoreMap[uid]
    const p = profiles?.find(x => x.id === uid)
    return {
      userId: uid,
      name: p?.full_name ?? 'Anonym',
      avatarUrl: p?.avatar_url ?? null,
      correct: s.correct,
      total: s.total,
      pct: Math.round((s.correct / s.total) * 100),
    }
  })
}

export default async function PredictionPage() {
  const qc  = makeQueryClient()
  const pub = createPublicSupabase()

  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['prediktion', 'leaderboard'],
      queryFn: () => buildLeaderboard(pub),
    }),
    qc.prefetchQuery({
      queryKey: ['prediktion', 'upcoming'],
      queryFn: async () => {
        const { data } = await pub
          .from('matches')
          .select('id,date,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
          .eq('status', 'upcoming')
          .gte('date', SEASON.CURRENT)
          .order('date')
          .limit(8)
        return (data ?? []) as unknown as UpcomingMatch[]
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PredictionClient />
    </HydrationBoundary>
  )
}
