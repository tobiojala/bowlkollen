import { NextResponse } from 'next/server'
import { createPublicSupabase } from '@/lib/supabase-public'
import { syncBitsTeamEvents } from '@/lib/sync-bits-team-events'

// Auto-Story Engine sweep. Runs the BITS story engine for every team with a
// recently-finished match, so the home feed fills with match_result / win_streak
// events. Bearer CRON_SECRET, like the bits-sync cron. Schedule it (pg_cron /
// Vercel cron) a few times a day. Idempotent — safe to run often.
export const maxDuration = 60

const RECENT_DAYS = 14

function authorized(req: Request): boolean {
  return (req.headers.get('authorization') ?? '') === `Bearer ${process.env.CRON_SECRET}`
}

async function run() {
  const pub = createPublicSupabase()
  const since = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString().slice(0, 10)
  const { data } = await pub
    .from('bits_matches')
    .select('home_bits_team_id, away_bits_team_id')
    .eq('is_finished', true)
    .gte('match_date', since)

  const ids = new Set<number>()
  for (const m of (data ?? []) as { home_bits_team_id: number | null; away_bits_team_id: number | null }[]) {
    if (m.home_bits_team_id) ids.add(m.home_bits_team_id)
    if (m.away_bits_team_id) ids.add(m.away_bits_team_id)
  }

  let events = 0
  for (const id of ids) {
    try { events += await syncBitsTeamEvents(id) } catch { /* one team failing shouldn't abort the sweep */ }
  }
  return { teams: ids.size, events }
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, ...(await run()) })
}
export async function GET(req: Request) { return POST(req) }
