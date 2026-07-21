import { createPublicSupabase } from '@/lib/supabase-public'
import { buildIcs, type CalEvent } from '@/lib/calendar'
import { SEASON } from '@/lib/constants'

// Live, subscribable calendar for a BITS team's fixtures (mirrors
// calendar/division/[id] — see that route's comment). Keyed on bits_team_id,
// unlike the legacy calendar/team/[id] which is keyed on the old teams.uuid.
export const revalidate = 3600

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const teamId = parseInt(id, 10)
  if (isNaN(teamId)) return new Response('Bad team id', { status: 400 })

  const supabase   = createPublicSupabase()
  const seasonYear = Number(SEASON.CURRENT.slice(0, 4))

  const [{ data: team }, { data: matches }] = await Promise.all([
    supabase.from('bits_teams').select('name').eq('bits_team_id', teamId).maybeSingle(),
    supabase.from('bits_matches')
      .select('bits_match_id, home_team_name, away_team_name, match_date, hall_name, division_name')
      .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
      .eq('season_id', seasonYear)
      .eq('is_finished', false)
      .order('match_date', { ascending: true }),
  ])

  if (!team) return new Response('Team not found', { status: 404 })

  const events: CalEvent[] = (matches ?? [])
    .filter((m): m is typeof m & { match_date: string } => !!m.match_date)
    .map(m => ({
      uid:        `lag-${teamId}-match-${m.bits_match_id}@bowlkollen`,
      start:      new Date(m.match_date + 'T00:00:00Z'),
      allDay:     true,
      summary:    `${m.home_team_name} – ${m.away_team_name}`,
      location:   m.hall_name ?? undefined,
      description: m.division_name ?? undefined,
    }))

  const ics = buildIcs(`${team.name} — Bowlkollen`, events)

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="lag-${teamId}.ics"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
