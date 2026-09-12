import { NextResponse } from 'next/server'
import { getMatchScores, parseTeamSeries, parsePlayerTotals } from '@/lib/bits-client'

// Live match scores, pulled straight from BITS server-side (the same
// GetMatchScores endpoint the nightly sync uses). Server-side keeps us off the
// home-IP block and out of CORS. A short shared cache means many viewers polling
// the same match hit BITS at most once per TTL, not once per viewer.
//
// GetMatchScores' mid-match shape isn't guaranteed (the sync only ever calls it
// on FINISHED matches), so we degrade gracefully: a failure or unexpected shape
// returns empty series (the UI then shows "waiting for the first serie") rather
// than a hard error. Append ?debug=1 to see the raw diagnosis instead.
export const dynamic = 'force-dynamic'

const TTL_MS = 25_000
type Cached = { at: number; data: unknown }
const cache = new Map<number, Cached>()
const EMPTY = (note?: string) => ({ series: { teamA: [], teamB: [] }, players: [], updatedAt: new Date().toISOString(), note })

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
    const hasSeries = Array.isArray((scores as { series?: unknown }).series)
    const data = { series: parseTeamSeries(scores), players: parsePlayerTotals(scores), updatedAt: new Date().toISOString() }
    if (debug) {
      return NextResponse.json({
        ok: true, hasSeries, rawSerieCount: hasSeries ? (scores as { series: unknown[] }).series.length : null,
        topLevelKeys: Object.keys(scores ?? {}), teamA: data.series.teamA, teamB: data.series.teamB, players: data.players.length,
      }, { status: 200 })
    }
    cache.set(id, { at: Date.now(), data })
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (debug) return NextResponse.json({ ok: false, stage: 'parse', error: String(e), topLevelKeys: Object.keys(scores ?? {}) }, { status: 200 })
    return NextResponse.json(EMPTY('parse-failed'), { headers: { 'Cache-Control': 'no-store' } })
  }
}
