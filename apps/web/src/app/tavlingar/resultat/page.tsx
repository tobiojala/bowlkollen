import { createPublicSupabase } from '@/lib/supabase-server'
import { ResultatClient, type CompListRow } from './_components/ResultatClient'

export const revalidate = 300

export default async function ResultatPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const sp = await searchParams
  const supabase = createPublicSupabase()

  const { data: seasonRows } = await supabase.from('bits_competitions').select('season_id')
  const seasons = [...new Set(((seasonRows ?? []) as { season_id: number }[]).map(r => r.season_id))].sort((a, b) => b - a)
  const wanted = sp?.season ? Number(sp.season) : null
  const season = wanted && seasons.includes(wanted) ? wanted : (seasons[0] ?? new Date().getFullYear())

  const { data } = await supabase
    .from('bits_competitions')
    .select('bits_competition_id, name, hall_city, start_date, results_synced')
    .eq('season_id', season)
    .order('start_date', { ascending: false })
    .limit(1000)

  return <ResultatClient competitions={(data ?? []) as CompListRow[]} seasons={seasons} season={season} />
}
