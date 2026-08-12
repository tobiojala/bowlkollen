import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import {
  syncBitsMatchesForSeason,
  syncBitsPlayers,
  syncPendingDelmatches,
  syncPendingExactResults,
  syncPendingMatchScores,
} from '@/lib/bits-sync'

// Called every few hours by pg_cron (supabase/migrations/bits_sync_cron.sql).
// Auth: Authorization: Bearer $CRON_SECRET header.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Bowling season runs Jul→Jun; season_id is the starting calendar year. Using
  // getFullYear() directly would target the wrong (future, empty) season Jan–Jun and
  // silently stop updating the live season — so pin to the July boundary.
  const now = new Date()
  const season = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  // Refresh the national player list once a day (heavy full paginate) — keeps search
  // rosters current, including players whose lower-division team was dropped.
  const withPlayers = now.getUTCHours() < 3

  const tasks: Promise<unknown>[] = [
    syncBitsMatchesForSeason(season),
    syncPendingMatchScores(200),
    syncPendingExactResults(150),
    syncPendingDelmatches(150),
  ]
  if (withPlayers) tasks.push(syncBitsPlayers())

  const settled = await Promise.allSettled(tasks)
  const [matchesResult, scoresResult, exactResult, delmatchResult, playersResult] = settled
  const val = (r?: PromiseSettledResult<unknown>) =>
    r?.status === 'fulfilled' ? r.value : { ok: false, error: String(r?.reason) }

  const summary = {
    ts: now.toISOString(),
    season,
    matches: val(matchesResult),
    scores: val(scoresResult),
    exact: val(exactResult),
    delmatch: val(delmatchResult),
    ...(withPlayers ? { players: val(playersResult) } : {}),
  }
  const ok = settled.every((r) => r.status === 'fulfilled' && (r.value as { ok?: boolean })?.ok !== false)

  // Record the run so /api/health/sync can tell whether the sync is alive (best-effort).
  try {
    await (createServiceSupabase() as unknown as SupabaseClient).from('sync_runs').insert({ kind: 'bits', ok, summary })
  } catch {
    /* logging must never fail the sync */
  }

  return NextResponse.json(summary)
}
