import { NextResponse } from 'next/server'
import { getMatchScores, getDivisions, parseTeamSeries, parsePlayerTotals, BASE_HEADERS, getSession } from '@/lib/bits-client'

// TEMP discovery: find which bits.swebowl.se/MiscFrontApiConnector endpoint
// returns a match's serie/player scores (api.swebowl.se is 403; the site host
// works). Gated by a throwaway token; remove once the scores endpoint is known.
const PROBE_TOKEN = 'find-scores-9x2'
const SITE = 'https://bits.swebowl.se'
const CONNECTORS = [
  'GetMatchHeadInfo', 'GetMatchScores', 'GetMatchResult', 'GetMatchResults',
  'GetMatchSerieResults', 'GetMatchPlayerResults', 'GetMatchGameResults', 'GetMatchSeries', 'GetMatchDetail',
]
function shapeOf(j: unknown): unknown {
  if (Array.isArray(j)) return { array: j.length, keys0: j[0] && typeof j[0] === 'object' ? Object.keys(j[0] as object).slice(0, 20) : typeof j[0] }
  if (j && typeof j === 'object') return { keys: Object.keys(j as object).slice(0, 25) }
  return typeof j
}
async function probeConnectors(id: number) {
  const cookie = await getSession()
  const h = { ...BASE_HEADERS, Cookie: cookie, Accept: 'application/json, */*', 'X-Requested-With': 'XMLHttpRequest', Referer: `${SITE}/match-detail?matchid=${id}` }
  const out: unknown[] = []
  for (const name of CONNECTORS) {
    try {
      const res = await fetch(`${SITE}/MiscFrontApiConnector/${name}?id=${id}`, { headers: h, cache: 'no-store' })
      let shape: unknown = null
      if (res.ok) { try { shape = shapeOf(await res.json()) } catch { shape = 'non-json' } }
      out.push({ name, status: res.status, shape })
    } catch (e) { out.push({ name, error: String(e) }) }
    await new Promise(r => setTimeout(r, 400))
  }
  return out
}

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
  const sp = new URL(req.url).searchParams
  if (sp.get('probe') === PROBE_TOKEN) {
    if (sp.get('dump') === '1') {
      const cookie = await getSession()
      const r = await fetch(`${SITE}/MiscFrontApiConnector/GetMatchScores?id=${id}`, {
        headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'application/json, */*', 'X-Requested-With': 'XMLHttpRequest', Referer: `${SITE}/match-detail?matchid=${id}` }, cache: 'no-store',
      })
      return new NextResponse(await r.text(), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return NextResponse.json({ id, connectors: await probeConnectors(id) }, { status: 200 })
  }
  const debug = sp.get('debug') === '1'

  const hit = cache.get(id)
  if (hit && !debug && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.data, { headers: { 'Cache-Control': 'no-store' } })
  }

  let scores: Awaited<ReturnType<typeof getMatchScores>>
  try {
    scores = await getMatchScores(id)
  } catch (e) {
    if (debug) {
      // Probe a second api.swebowl.se endpoint to tell "this endpoint is
      // blocked/moved" apart from "the whole API auth is broken from here".
      let divisions = 'unknown'
      try { const d = await getDivisions(2025); divisions = `ok ${Array.isArray(d) ? d.length : '?'}` } catch (de) { divisions = String(de) }
      return NextResponse.json({ ok: false, stage: 'fetch', error: String(e), divisionsProbe: divisions }, { status: 200 })
    }
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
