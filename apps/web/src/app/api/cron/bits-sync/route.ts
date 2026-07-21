import { NextResponse } from 'next/server'
import { syncBitsMatchesForSeason, syncPendingMatchScores } from '@/lib/bits-sync'

// Called nightly by the Supabase edge function (supabase/functions/bits-nightly).
// Auth: Authorization: Bearer $CRON_SECRET header (set in both places).
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization') ?? ''

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const season = new Date().getFullYear()

  const [matchesResult, scoresResult] = await Promise.allSettled([
    syncBitsMatchesForSeason(season),
    syncPendingMatchScores(200),
  ])

  return NextResponse.json({
    ts:      new Date().toISOString(),
    season,
    matches: matchesResult.status === 'fulfilled' ? matchesResult.value : { ok: false, error: String(matchesResult.reason) },
    scores:  scoresResult.status  === 'fulfilled' ? scoresResult.value  : { ok: false, error: String(scoresResult.reason) },
  })
}
