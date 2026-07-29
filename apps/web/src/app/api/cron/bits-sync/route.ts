import { NextResponse } from 'next/server'
import { syncBitsMatchesForSeason, syncPendingExactResults, syncPendingMatchScores } from '@/lib/bits-sync'

// Called nightly by the Supabase edge function (supabase/functions/bits-nightly).
// Auth: Authorization: Bearer $CRON_SECRET header (set in both places).
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization') ?? ''

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const season = new Date().getFullYear()

  const [matchesResult, scoresResult, exactResult] = await Promise.allSettled([
    syncBitsMatchesForSeason(season),
    syncPendingMatchScores(200),
    // Was missing — this is why the exact per-player backfill stalled at ~20%. Keeps it
    // moving nightly (all divisions) so lower-division player data fills in and stays current.
    syncPendingExactResults(150),
  ])

  return NextResponse.json({
    ts:      new Date().toISOString(),
    season,
    matches: matchesResult.status === 'fulfilled' ? matchesResult.value : { ok: false, error: String(matchesResult.reason) },
    scores:  scoresResult.status  === 'fulfilled' ? scoresResult.value  : { ok: false, error: String(scoresResult.reason) },
    exact:   exactResult.status   === 'fulfilled' ? exactResult.value   : { ok: false, error: String(exactResult.reason) },
  })
}
