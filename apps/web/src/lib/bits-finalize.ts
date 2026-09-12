import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceSupabase } from '@/lib/supabase-server'
import { computeDelmatcher } from '@bowlkollen/core'
import { parseTeamSeries, parseMatchDelmatchSlots } from '@/lib/bits-client'
import { getMatchScores, getMatchStatus, MATCH_STATUS_FINISHED } from '@/lib/bits-match-scores'
import { syncPendingMatchScores, syncPendingExactResults, syncPendingDelmatches } from '@/lib/bits-sync'

// On-demand finalize of a single match the moment BITS marks it finished
// (matchStatus 3) — so a live view flips to the real finished page without waiting
// for the 3h cron. Sets is_finished + the banpoäng result + pinfall, then runs the
// per-match pending processors for the full detail (scores, exact results,
// delmatch). Self-guards on matchStatus, so it's a safe no-op if the match isn't
// actually over.
export async function finalizeMatch(bitsMatchId: number): Promise<{ finished: boolean }> {
  const status = await getMatchStatus(bitsMatchId)
  if (status !== MATCH_STATUS_FINISHED) return { finished: false }

  const db = createServiceSupabase() as unknown as SupabaseClient
  const scores = await getMatchScores(bitsMatchId)
  const d = computeDelmatcher(parseMatchDelmatchSlots(scores).map((s) => ({ ...s, publicId: null })))
  const ts = parseTeamSeries(scores)
  const homePins = ts.teamA.reduce((a, b) => a + b, 0)
  const awayPins = ts.teamB.reduce((a, b) => a + b, 0)

  await db.from('bits_matches').update({
    is_finished: true, home_result: d.homeBanp, away_result: d.awayBanp,
    home_score: homePins || null, away_score: awayPins || null, synced_at: new Date().toISOString(),
  }).eq('bits_match_id', bitsMatchId)

  // Reuse the per-match pending processors (match-scoped) for the full detail.
  await syncPendingMatchScores(1, undefined, bitsMatchId)
  await syncPendingExactResults(1, undefined, bitsMatchId)
  await syncPendingDelmatches(1, undefined, bitsMatchId)
  return { finished: true }
}
