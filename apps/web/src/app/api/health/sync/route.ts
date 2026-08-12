import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

// Sync health for uptime monitors. Returns 200 when the sync ran recently and ok,
// 503 when it's stale/failing — point an uptime check at
//   /api/health/sync?token=$CRON_SECRET
// and it alerts automatically. Also readable by hand for a quick glance.
const STALE_MINUTES = 8 * 60 // cron is every 3h; alert after ~2 missed cycles

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const token = new URL(req.url).searchParams.get('token')
  const auth = req.headers.get('authorization') ?? ''
  if (!secret || (token !== secret && auth !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceSupabase() as unknown as SupabaseClient // sync_runs not in generated types yet
  const pending = (col: string) =>
    db.from('bits_matches').select('bits_match_id', { count: 'exact', head: true }).eq('is_finished', true).eq(col, false)

  const [lastRun, players, scores, exact, delmatch] = await Promise.all([
    db.from('sync_runs').select('ran_at, ok, summary').order('ran_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('bits_players').select('synced_at').order('synced_at', { ascending: false }).limit(1).maybeSingle(),
    pending('scores_synced'),
    pending('exact_results_synced'),
    pending('delmatch_synced'),
  ])

  const ranAt = lastRun.data?.ran_at ? new Date(lastRun.data.ran_at) : null
  const ageMinutes = ranAt ? Math.round((Date.now() - ranAt.getTime()) / 60000) : null
  const stale = ageMinutes == null || ageMinutes > STALE_MINUTES || lastRun.data?.ok === false

  return NextResponse.json(
    {
      status: stale ? 'stale' : 'ok',
      lastRun: ranAt?.toISOString() ?? null,
      ageMinutes,
      lastRunOk: lastRun.data?.ok ?? null,
      playersLastSyncedAt: players.data?.synced_at ?? null,
      pending: { scores: scores.count ?? 0, exact: exact.count ?? 0, delmatch: delmatch.count ?? 0 },
      staleThresholdMinutes: STALE_MINUTES,
      now: new Date().toISOString(),
    },
    { status: stale ? 503 : 200 },
  )
}
