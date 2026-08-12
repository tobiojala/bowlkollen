import { NextResponse } from 'next/server'
import { syncBitsMatchesForSeason, syncPendingExactResults, syncPendingMatchScores, syncPendingDelmatches } from '@/lib/bits-sync'

// Called nightly by the Supabase edge function (supabase/functions/bits-nightly).
// Auth: Authorization: Bearer $CRON_SECRET header (set in both places).
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization') ?? ''

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Bowling season runs Jul→Jun; season_id is the starting calendar year. Using
  // getFullYear() directly would target the wrong (future, empty) season Jan–Jun and
  // silently stop updating the live season — so pin to the July boundary.
  const now = new Date()
  const season = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1

  const [matchesResult, scoresResult, exactResult, delmatchResult] = await Promise.allSettled([
    syncBitsMatchesForSeason(season),
    syncPendingMatchScores(200),
    // Was missing — this is why the exact per-player backfill stalled at ~20%. Keeps it
    // moving nightly (all divisions) so lower-division player data fills in and stays current.
    syncPendingExactResults(150),
    // Delmatch (bord) reconstruction from the same GetMatchScores payload — keeps the
    // 2v2/1v1 head-to-head data current as new matches finish.
    syncPendingDelmatches(150),
  ])

  return NextResponse.json({
    ts:       new Date().toISOString(),
    season,
    matches:  matchesResult.status  === 'fulfilled' ? matchesResult.value  : { ok: false, error: String(matchesResult.reason) },
    scores:   scoresResult.status   === 'fulfilled' ? scoresResult.value   : { ok: false, error: String(scoresResult.reason) },
    exact:    exactResult.status    === 'fulfilled' ? exactResult.value    : { ok: false, error: String(exactResult.reason) },
    delmatch: delmatchResult.status === 'fulfilled' ? delmatchResult.value : { ok: false, error: String(delmatchResult.reason) },
  })
}
