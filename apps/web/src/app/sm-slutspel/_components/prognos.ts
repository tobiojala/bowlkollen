import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { computeStandings, type TeamStanding } from '@/lib/division-standings'
import { toMatchRow, type DbMatchRow } from '@/lib/bits-matches'
import { SEASON, STALE } from '@/lib/constants'

// Live SM-slutspel prognosis, seeded from the REAL Elitserien grundserie table
// (core computeStandings on actual matches — same table as the division page).
// Format (SvBF): top 4 qualify; #1 PICKS a semifinal opponent (3:an/4:an) and #2
// meets the other, so we never fabricate the pairings — we show who's on track.
// Not "meaningful" until each top-4 team has played a few rounds, so early-season
// noise never gets presented as a seeding (shows TBD instead).
export type GenderPrognos = { top4: TeamStanding[]; meaningful: boolean }
export type SlutspelPrognos = { herrar: GenderPrognos; damer: GenderPrognos; seasonLabel: string }

const MIN_PLAYED = 3

async function gender(db: ReturnType<typeof createClient>, divisionId: number, seasonYear: number): Promise<GenderPrognos> {
  const { data } = await db.from('bits_matches').select('*')
    .eq('bits_division_id', divisionId).eq('season_id', seasonYear)
  const matches = ((data ?? []) as unknown as DbMatchRow[]).map(toMatchRow)
  const top4 = computeStandings(matches).slice(0, 4)
  const meaningful = top4.length === 4 && top4.every(t => t.played >= MIN_PLAYED)
  return { top4, meaningful }
}

export function useSlutspelPrognos() {
  const seasonYear = Number(SEASON.CURRENT.slice(0, 4))
  return useQuery<SlutspelPrognos>({
    queryKey: ['sm-slutspel-prognos', seasonYear],
    staleTime: STALE.MEDIUM,
    queryFn: async () => {
      const db = createClient()
      const { data: divs } = await db.from('bits_divisions')
        .select('bits_division_id, name').ilike('name', 'Elitserien%').eq('season_id', seasonYear)
      const list = (divs ?? []) as { bits_division_id: number; name: string }[]
      const herrarDiv = list.find(d => !d.name.toLowerCase().includes('dam'))
      const damerDiv  = list.find(d =>  d.name.toLowerCase().includes('dam'))
      const empty: GenderPrognos = { top4: [], meaningful: false }
      const [herrar, damer] = await Promise.all([
        herrarDiv ? gender(db, herrarDiv.bits_division_id, seasonYear) : Promise.resolve(empty),
        damerDiv  ? gender(db, damerDiv.bits_division_id, seasonYear)  : Promise.resolve(empty),
      ])
      return { herrar, damer, seasonLabel: `${seasonYear}/${String((seasonYear + 1) % 100).padStart(2, '0')}` }
    },
  })
}
