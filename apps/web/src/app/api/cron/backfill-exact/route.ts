import { NextResponse } from 'next/server'
import { syncPendingExactResults } from '@/lib/bits-sync'
import { createServiceSupabase } from '@/lib/supabase-server'

// One-time catch-up for the exact per-player results backfill (it stalled at ~20% because
// the nightly cron only synced scores, never exact results — now fixed there too). Run
// this LOCALLY in a loop until `remaining` hits 0; the app's own sync handles the BITS
// session, so nothing is replicated. Auth: Authorization: Bearer $CRON_SECRET.
//
//   S=<your CRON_SECRET>
//   while :; do r=$(curl -s -X POST "http://localhost:3000/api/cron/backfill-exact?limit=400" \
//        -H "Authorization: Bearer $S"); echo "$r"; \
//        echo "$r" | grep -q '"remaining":0' && break; sleep 2; done

export const maxDuration = 300 // long batches when deployed on Vercel Pro; no limit locally

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = Math.min(1000, Math.max(1, Number(new URL(req.url).searchParams.get('limit') ?? 300)))
  const result = await syncPendingExactResults(limit)

  const db = createServiceSupabase()
  const { count } = await db
    .from('bits_matches')
    .select('bits_match_id', { count: 'exact', head: true })
    .eq('is_finished', true)
    .eq('exact_results_synced', false)

  return NextResponse.json({ ...result, remaining: count ?? null })
}
