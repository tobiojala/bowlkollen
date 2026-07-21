import { createPublicSupabase } from '@/lib/supabase-public'
import { buildIcs, type CalEvent } from '@/lib/calendar'
import { SEASON } from '@/lib/constants'

// Live, subscribable calendar for a division. Subscribing (webcal://) means the
// user's phone/Google/Outlook re-fetches and stays in sync as fixtures change.
export const revalidate = 3600

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const divisionId = parseInt(id, 10)
  if (isNaN(divisionId)) return new Response('Bad division id', { status: 400 })

  const supabase   = createPublicSupabase()
  const seasonYear = Number(SEASON.CURRENT.slice(0, 4))

  const [{ data: division }, { data: matches }] = await Promise.all([
    supabase.from('bits_divisions')
      .select('name').eq('bits_division_id', divisionId).eq('season_id', seasonYear).single(),
    supabase.from('bits_matches')
      .select('bits_match_id, home_team_name, away_team_name, match_date, hall_name, round_id')
      .eq('bits_division_id', divisionId).eq('season_id', seasonYear)
      // Calendar = what's coming. Played matches drop out automatically.
      .eq('is_finished', false)
      .order('match_date', { ascending: true }),
  ])

  if (!division) return new Response('Division not found', { status: 404 })

  const events: CalEvent[] = (matches ?? [])
    .filter((m): m is typeof m & { match_date: string } => !!m.match_date)
    .map(m => ({
      uid:        `division-${divisionId}-match-${m.bits_match_id}@bowlkollen`,
      // bits_matches.match_date is a date (no time) → all-day event.
      start:      new Date(m.match_date + 'T00:00:00Z'),
      allDay:     true,
      summary:    `${m.home_team_name} – ${m.away_team_name}`,
      location:   m.hall_name ?? undefined,
      description: `${division.name}${m.round_id != null ? ` · Omgång ${m.round_id}` : ''}`,
    }))

  const ics = buildIcs(`${division.name} — Bowlkollen`, events)

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="division-${divisionId}.ics"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
