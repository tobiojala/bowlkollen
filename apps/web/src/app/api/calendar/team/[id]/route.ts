import { createPublicSupabase } from '@/lib/supabase-public'
import { buildIcs, type CalEvent } from '@/lib/calendar'

// Live, subscribable calendar for a team's fixtures + results.
export const revalidate = 3600

type TeamRef = { name: string } | { name: string }[] | null
const refName = (r: TeamRef) => (Array.isArray(r) ? r[0]?.name : r?.name) ?? 'Okänt lag'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createPublicSupabase()

  const [{ data: team }, { data: matches }] = await Promise.all([
    supabase.from('teams').select('name').eq('id', id).single(),
    supabase.from('matches')
      .select('id,date,division,home:teams!home_team_id(name),away:teams!away_team_id(name)')
      .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
      // Calendar = upcoming fixtures only, not played history.
      .neq('status', 'completed')
      .order('date', { ascending: true }),
  ])

  if (!team) return new Response('Team not found', { status: 404 })

  const events: CalEvent[] = (matches ?? [])
    .filter((m): m is typeof m & { date: string } => !!m.date)
    .map(m => ({
      uid:        `team-${id}-match-${m.id}@bowlkollen`,
      // matches.date carries an unreliable time (legacy table) → all-day.
      start:      new Date(m.date.slice(0, 10) + 'T00:00:00Z'),
      allDay:     true,
      summary:    `${refName(m.home)} – ${refName(m.away)}`,
      description: m.division ?? undefined,
    }))

  const ics = buildIcs(`${team.name} — Bowlkollen`, events)

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="team-${id}.ics"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
