import { useQuery } from '@tanstack/react-query'
import { computeStandings, standingsNeighbors, type MatchRow } from '@/lib/division-standings'
import { createClient } from '@/lib/supabase'
import { STALE } from '@/lib/constants'

// Ported from native (apps/mobile/lib/feed-standings.ts) so the home feed's
// standings-snapshot card is identical on both. Same core standings engine;
// only the Supabase client differs (browser vs native).

const CURRENT_SEASON = 2026
const PREVIOUS_SEASON = 2025
const FEATURED = '%Elitserien%'
const STANDING_COLS =
  'bits_match_id, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, home_result, away_result, is_finished, match_date, round_id, hall_name'

export type LadderRow = { rank: number; teamId: number; teamName: string; points: number; subject: boolean }

// A standings card only shows because a team just DID something — a climb, a
// streak, a new lead. The table is the context, the achievement is the point.
export type FeedStanding = {
  divisionId: number
  division: string
  historical: boolean
  badge: string      // SERIELEDARE / KLÄTTRAR / SEGERSVIT / … — the event category
  headline: string   // the achievement, no team name / no number the chip or ladder already show
  teamId: number
  teamName: string
  delta: number      // spots climbed since the previous round (>0 = up)
  streak: number     // trailing wins
  ladder: LadderRow[] // the subject + a neighbour each side (rank + points)
}

const ordinal = (n: number) => (n <= 2 ? `${n}:a` : `${n}:e`)

function trailingWins(matches: MatchRow[], teamId: number): number {
  const played = matches
    .filter((m) => m.is_finished && m.home_result != null && m.away_result != null)
    .sort((a, b) => b.match_date.localeCompare(a.match_date))
  let s = 0
  for (const m of played) {
    const home = m.home_bits_team_id === teamId
    const my = home ? m.home_result! : m.away_result!
    const opp = home ? m.away_result! : m.home_result!
    if (my > opp) s++
    else break
  }
  return s
}

// The single most notable team event in a division (or null if nothing stands out).
function divisionStory(matches: MatchRow[], divisionId: number, division: string, historical: boolean): FeedStanding | null {
  const finished = matches.filter((m) => m.is_finished && m.home_result != null && m.away_result != null)
  if (finished.length === 0) return null

  const table = computeStandings(matches)
  if (table.length === 0) return null
  const rankOf = (tbl: typeof table, id: number) => {
    const i = tbl.findIndex((s) => s.teamId === id)
    return i < 0 ? null : i + 1
  }

  const latest = finished.reduce((a, b) => (a.match_date >= b.match_date ? a : b))
  const lastRound = latest.round_id
  const prevTable = computeStandings(matches.filter((m) => m.round_id !== lastRound))
  const teamsLastRound = [
    ...new Set(finished.filter((m) => m.round_id === lastRound).flatMap((m) => [m.home_bits_team_id, m.away_bits_team_id])),
  ]

  type Cand = { id: number; rank: number; delta: number; streak: number; newLeader: boolean; score: number }
  let best: Cand | null = null
  const consider = (ids: number[], requireNotable: boolean) => {
    for (const id of ids) {
      const rank = rankOf(table, id)
      if (rank == null) continue
      const prev = rankOf(prevTable, id)
      const delta = prev != null ? prev - rank : 0
      const streak = trailingWins(matches, id)
      const newLeader = rank === 1 && (prev == null || prev > 1)
      let score = 0
      if (newLeader) score += 100
      if (delta > 0) score += delta * 12 + 5
      if (streak >= 2) score += streak * 6
      if (rank === 1) score += 2
      if (requireNotable && score === 0) continue
      if (!best || score > best.score) best = { id, rank, delta, streak, newLeader, score }
    }
  }
  consider(teamsLastRound, true)
  if (!best) consider([table[0].teamId], false)

  if (!best) return null
  const b: Cand = best
  const row = table[b.rank - 1]

  let badge: string
  let headline: string
  if (historical) {
    badge = 'FÖRRA SÄSONGEN'
    headline = b.rank === 1 ? 'Vann serien' : `Slutade ${ordinal(b.rank)}`
  } else if (b.newLeader) {
    badge = 'SERIELEDARE'
    headline = 'Tar serieledningen'
  } else if (b.streak >= 2) {
    badge = 'SEGERSVIT'
    headline = `${b.streak} raka segrar`
  } else if (b.delta > 0) {
    badge = 'KLÄTTRAR'
    headline = 'Klättrar i tabellen'
  } else {
    badge = 'I TOPPEN'
    headline = 'Leder serien'
  }

  const ladder: LadderRow[] = standingsNeighbors(table, b.id, 1).map((s) => ({
    rank: rankOf(table, s.teamId)!,
    teamId: s.teamId,
    teamName: s.teamName,
    points: s.points,
    subject: s.teamId === b.id,
  }))

  return { divisionId, division, historical, badge, headline, teamId: b.id, teamName: row.teamName, delta: b.delta, streak: b.streak, ladder }
}

async function seasonMatches(divisionId: number, season: number): Promise<MatchRow[]> {
  const { data } = await createClient()
    .from('bits_matches').select(STANDING_COLS)
    .eq('bits_division_id', divisionId).eq('season_id', season)
  return (data ?? []) as unknown as MatchRow[]
}

// Featured (Elitserien) team stories for the feed, with the pre-season fallback.
export function useFeedStandings() {
  return useQuery({
    queryKey: ['feed-standings'],
    staleTime: STALE.LONG,
    queryFn: async (): Promise<FeedStanding[]> => {
      const { data: divs } = await createClient()
        .from('bits_divisions').select('bits_division_id, name')
        .eq('season_id', CURRENT_SEASON).ilike('name', FEATURED).limit(2)

      const out: FeedStanding[] = []
      for (const d of (divs ?? []) as { bits_division_id: number; name: string }[]) {
        let matches = await seasonMatches(d.bits_division_id, CURRENT_SEASON)
        let historical = false
        if (!matches.some((m) => m.is_finished)) {
          const prev = await seasonMatches(d.bits_division_id, PREVIOUS_SEASON)
          if (prev.some((m) => m.is_finished)) { matches = prev; historical = true }
        }
        const story = divisionStory(matches, d.bits_division_id, d.name, historical)
        if (story) out.push(story)
      }
      return out
    },
  })
}
