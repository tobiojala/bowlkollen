import { NextResponse } from 'next/server'
import { parseTeamSeries, parsePlayerTotals } from '@/lib/bits-client'
import { getMatchScores } from '@/lib/bits-match-scores'

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
    const data = { series: parseTeamSeries(scores), players: parsePlayerTotals(scores), updatedAt: new Date().toISOString() }
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
