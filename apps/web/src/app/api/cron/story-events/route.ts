import { NextResponse } from 'next/server'
import { createPublicSupabase } from '@/lib/supabase-public'
import { syncBitsTeamEvents } from '@/lib/sync-bits-team-events'
import { SEASON } from '@/lib/constants'

// Auto-Story Engine sweep. Runs the BITS story engine for every team with a
// recently-finished match, so the home feed fills with match_result / win_streak
// events. Bearer CRON_SECRET, like the bits-sync cron. Schedule it (pg_cron /
// Vercel cron) a few times a day. Idempotent — safe to run often.
export const maxDuration = 60

const RECENT_DAYS = 14
const DEFAULT_LIMIT = 25 // teams per invocation — keeps a run under the timeout

function authorized(req: Request): boolean {
  return (req.headers.get('authorization') ?? '') === `Bearer ${process.env.CRON_SECRET}`
}

// Query params (all optional):
//   ?team=ID   — process just one team (fast; for testing)
//   ?since=YYYY-MM-DD — analyse from this date (e.g. last season) instead of the current season
//   ?limit=N   — cap teams per run (default 25) so a sweep never times out; run repeatedly to cover more
async function run(opts: { since: string | null; teamId: number | null; limit: number }) {
  const pub = createPublicSupabase()
  const engineFloor = opts.since ?? SEASON.CURRENT

  let ids: number[]
  if (opts.teamId) {
    ids = [opts.teamId]
  } else {
    const discoverFloor = opts.since ?? new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString().slice(0, 10)
    const { data } = await pub
      .from('bits_matches')
      .select('home_bits_team_id, away_bits_team_id')
      .eq('is_finished', true)
      .gte('match_date', discoverFloor)
    const set = new Set<number>()
    for (const m of (data ?? []) as { home_bits_team_id: number | null; away_bits_team_id: number | null }[]) {
      if (m.home_bits_team_id) set.add(m.home_bits_team_id)
      if (m.away_bits_team_id) set.add(m.away_bits_team_id)
    }
    // Shuffle so repeated capped runs cover different teams (idempotent, so overlap is cheap).
    ids = [...set].sort(() => Math.random() - 0.5).slice(0, opts.limit)
  }

  let events = 0
  for (const id of ids) {
    try { events += await syncBitsTeamEvents(id, engineFloor) } catch { /* one team failing shouldn't abort the sweep */ }
  }
  return { teams: ids.length, events }
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const sp = new URL(req.url).searchParams
  const teamId = Number(sp.get('team')) || null
  const limit = Number(sp.get('limit')) || DEFAULT_LIMIT
  return NextResponse.json({ ok: true, ...(await run({ since: sp.get('since'), teamId, limit })) })
}
export async function GET(req: Request) { return POST(req) }
