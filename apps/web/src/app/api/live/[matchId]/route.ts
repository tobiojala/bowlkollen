import { NextResponse } from 'next/server'
import { getMatchScores, parseTeamSeries, parsePlayerTotals } from '@/lib/bits-client'

// Live match scores, pulled straight from BITS server-side (the same
// GetMatchScores endpoint the nightly sync uses — it returns whatever series are
// entered so far, so mid-match it's the live board). Server-side keeps us off the
// home-IP block and out of CORS. A short shared cache means many viewers polling
// the same match hit BITS at most once per TTL, not once per viewer.
export const dynamic = 'force-dynamic'

const TTL_MS = 25_000
type Cached = { at: number; data: unknown }
const cache = new Map<number, Cached>()

export async function GET(_req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const id = Number(matchId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid match id' }, { status: 400 })
  }

  const hit = cache.get(id)
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.data, { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const scores = await getMatchScores(id)
    const data = {
      series: parseTeamSeries(scores),
      players: parsePlayerTotals(scores),
      updatedAt: new Date().toISOString(),
    }
    cache.set(id, { at: Date.now(), data })
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
