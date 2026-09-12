import { NextResponse } from 'next/server'
import { parseTeamSeries, parsePlayerTotals, parseMatchDelmatchSlots } from '@/lib/bits-client'
import { getMatchScores, getMatchStatus, MATCH_STATUS_FINISHED } from '@/lib/bits-match-scores'
import { finalizeMatch } from '@/lib/bits-finalize'
import { computeDelmatcher } from '@bowlkollen/core'

// Running banpoäng (Elitserien: 4 bordpoäng + 1 serie-pinfall bonus = 5/serie,
// max 20). Only fully-bowled series count — a serie counts when every table has
// balanced, complete pairs and the serie shows the match's full table set, so the
// in-progress serie is naturally excluded. computeDelmatcher applies Blåboken §1.3.
function runningBanp(scores: Awaited<ReturnType<typeof getMatchScores>>) {
  const slots = parseMatchDelmatchSlots(scores)
  const bySerie = new Map<number, typeof slots>()
  for (const s of slots) { const a = bySerie.get(s.serie); if (a) a.push(s); else bySerie.set(s.serie, [s]) }
  const maxTables = Math.max(0, ...[...bySerie.values()].map((ss) => new Set(ss.map((s) => s.tableNo)).size))
  const complete = []
  for (const ss of bySerie.values()) {
    const tbl = new Map<number, { h: number; a: number }>()
    for (const s of ss) { const t = tbl.get(s.tableNo) ?? { h: 0, a: 0 }; if (s.isHomeTeam) t.h++; else t.a++; tbl.set(s.tableNo, t) }
    const balanced = [...tbl.values()].every((t) => t.h === t.a && t.h >= 1)
    if (maxTables > 0 && tbl.size === maxTables && balanced) for (const s of ss) complete.push({ ...s, publicId: null })
  }
  const d = computeDelmatcher(complete)
  return { home: d.homeBanp, away: d.awayBanp, completedSeries: d.series.length }
}

// Live match scores, pulled server-side from BITS' site-host GetMatchScores
// (bits.swebowl.se/MiscFrontApiConnector — the same call the live match-detail
// page makes). Server-side keeps us off any client IP block and out of CORS. A
// short shared cache means many viewers polling one match hit BITS at most once
// per TTL. Any failure degrades to empty series → the UI shows a "waiting" state
// rather than an error; ?debug=1 returns the raw diagnosis.
export const dynamic = 'force-dynamic'

const TTL_MS = 25_000
type Cached = { at: number; data: unknown }
const cache = new Map<number, Cached>()
const EMPTY = (note?: string) => ({ series: { teamA: [], teamB: [] }, players: [], banp: { home: 0, away: 0, completedSeries: 0 }, updatedAt: new Date().toISOString(), note })

export async function GET(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const id = Number(matchId)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'invalid match id' }, { status: 400 })
  const debug = new URL(req.url).searchParams.get('debug') === '1'

  const hit = cache.get(id)
  if (hit && !debug && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.data, { headers: { 'Cache-Control': 'no-store' } })
  }

  let scores: Awaited<ReturnType<typeof getMatchScores>>
  try {
    scores = await getMatchScores(id)
  } catch (e) {
    if (debug) return NextResponse.json({ ok: false, stage: 'fetch', error: String(e) }, { status: 200 })
    return NextResponse.json(EMPTY('fetch-failed'), { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const finished = (await getMatchStatus(id)) === MATCH_STATUS_FINISHED
    const data = { series: parseTeamSeries(scores), players: parsePlayerTotals(scores), banp: runningBanp(scores), finished, updatedAt: new Date().toISOString() }
    if (debug) {
      const hasSeries = Array.isArray((scores as { series?: unknown }).series)
      return NextResponse.json({ ok: true, hasSeries, teamA: data.series.teamA, teamB: data.series.teamB, players: data.players.length }, { status: 200 })
    }
    cache.set(id, { at: Date.now(), data })
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (debug) return NextResponse.json({ ok: false, stage: 'parse', error: String(e) }, { status: 200 })
    return NextResponse.json(EMPTY('parse-failed'), { headers: { 'Cache-Control': 'no-store' } })
  }
}

// Finalize a single match on demand: the live view POSTs here when BITS reports the
// match finished, so is_finished + results land in our DB immediately (rather than
// waiting for the 3h cron) and the page can render the real finished view.
// Self-guards on BITS' matchStatus, so it's a safe no-op if the match isn't over.
export async function POST(_req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const id = Number(matchId)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'invalid match id' }, { status: 400 })
  try {
    return NextResponse.json(await finalizeMatch(id), { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ finished: false, error: String(e) }, { status: 200 })
  }
}
