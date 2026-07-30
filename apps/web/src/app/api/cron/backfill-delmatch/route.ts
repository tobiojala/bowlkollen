import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { syncPendingDelmatches } from '@/lib/bits-sync'
import { createServiceSupabase } from '@/lib/supabase-server'

// One-time history backfill for the 2v2/1v1 delmatch (bord) reconstruction —
// re-parses GetMatchScores' scoreId (Serie/Table/Order) into bits_match_delmatch.
// Run LOCALLY in a loop until `remaining` hits 0. Auth: Authorization: Bearer $CRON_SECRET.
//
//   S=<your CRON_SECRET>
//   while :; do r=$(curl -s -X POST "http://localhost:3000/api/cron/backfill-delmatch?limit=400" \
//        -H "Authorization: Bearer $S"); echo "$r"; \
//        echo "$r" | grep -q '"remaining":0' && break; done

export const maxDuration = 300

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = Math.min(1000, Math.max(1, Number(new URL(req.url).searchParams.get('limit') ?? 300)))
  const result = await syncPendingDelmatches(limit)

  const db = createServiceSupabase() as unknown as SupabaseClient   // delmatch_synced not in generated types yet
  const { count } = await db
    .from('bits_matches')
    .select('bits_match_id', { count: 'exact', head: true })
    .eq('is_finished', true)
    .eq('delmatch_synced', false)

  return NextResponse.json({ ...result, remaining: count ?? null })
}
