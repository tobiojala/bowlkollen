import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import {
  syncBitsClubs,
  syncBitsDivisions,
  syncBitsMatchesForSeason,
  syncBitsPlayers,
  syncBitsTeamsForAllClubs,
  syncPendingDelmatches,
  syncPendingExactResults,
  syncPendingMatchScores,
} from '@/lib/bits-sync'
import { syncBitsCompetitions, syncPendingCompetitionResults } from '@/lib/bits-competitions-sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds — bump on Vercel Pro if the daily player sync needs longer

// Runs the BITS sync. Triggered by pg_cron (POST, supabase/migrations/bits_sync_cron.sql)
// OR Vercel Cron (GET, vercel.json) — both authenticate with $CRON_SECRET.
function authed(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  return !!secret && (req.headers.get('authorization') ?? '') === `Bearer ${secret}`
}

async function runSync() {
  // Bowling season runs Jul→Jun; season_id is the starting calendar year. Using
  // getFullYear() directly would target the wrong (future, empty) season Jan–Jun and
  // silently stop updating the live season — so pin to the July boundary.
  const now = new Date()
  const season = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  // Once a day (heavy jobs): the national player list AND the season's clubs +
  // teams. Refreshing clubs/teams daily is what makes SEASON ROLLOVER automatic —
  // when a new season's divisions appear in BITS they get seeded here, so team
  // pages + rosters populate without a manual admin sync.
  const daily = now.getUTCHours() < 3

  // Divisions first, EVERY run: syncBitsMatchesForSeason reads its division list
  // from the DB, so a brand-new season would otherwise find zero divisions and
  // silently sync nothing. One cheap API call + upsert guarantees they exist.
  const divisionsResult = await syncBitsDivisions(season)

  const tasks: Promise<unknown>[] = [
    syncBitsMatchesForSeason(season),
    syncPendingMatchScores(200),
    syncPendingExactResults(150),
    syncPendingDelmatches(150),
  ]
  if (daily) {
    tasks.push(syncBitsPlayers())
    tasks.push(syncBitsClubs(season))
    tasks.push(syncBitsTeamsForAllClubs(season))
    // Competitions (tävlingar): refresh the season's catalog, then work through a
    // batch of not-yet-fetched competitions' per-player results.
    tasks.push(syncBitsCompetitions(season))
    tasks.push(syncPendingCompetitionResults(20))
  }

  const settled = await Promise.allSettled(tasks)
  const [matchesResult, scoresResult, exactResult, delmatchResult, playersResult, clubsResult, teamsResult, compResult, compResultsResult] = settled
  const val = (r?: PromiseSettledResult<unknown>) =>
    r?.status === 'fulfilled' ? r.value : { ok: false, error: String(r?.reason) }

  // Rebuild Discover's (Hitta) recent-players materialized view now that today's
  // players/matches are in — keeps that page instant. Daily; best-effort so a
  // missing function (migration not yet applied) never fails the sync.
  let discover: unknown = { skipped: true }
  if (daily) {
    try {
      const { error } = await (createServiceSupabase() as unknown as SupabaseClient).rpc('refresh_discover_recent_players')
      discover = error ? { ok: false, error: error.message } : { ok: true }
    } catch (e) {
      discover = { ok: false, error: String(e) }
    }
  }

  const summary = {
    ts: now.toISOString(),
    season,
    divisions: divisionsResult,
    matches: val(matchesResult),
    scores: val(scoresResult),
    exact: val(exactResult),
    delmatch: val(delmatchResult),
    ...(daily ? {
      players: val(playersResult), clubs: val(clubsResult), teams: val(teamsResult),
      competitions: val(compResult), competitionResults: val(compResultsResult),
      discover,
    } : {}),
  }
  const ok = divisionsResult.ok && settled.every((r) => r.status === 'fulfilled' && (r.value as { ok?: boolean })?.ok !== false)

  // Record the run so /api/health/sync can tell whether the sync is alive (best-effort).
  try {
    await (createServiceSupabase() as unknown as SupabaseClient).from('sync_runs').insert({ kind: 'bits', ok, summary })
  } catch {
    /* logging must never fail the sync */
  }

  return summary
}

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await runSync())
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await runSync())
}
