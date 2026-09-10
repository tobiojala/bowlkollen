import { NextResponse } from 'next/server'
import { BITS_API, BITS_KEY, BASE_HEADERS, getSession } from '@/lib/bits-client'

// TEMPORARY discovery probe (2026-09-10): the BITS ranking API isn't documented,
// and it can't be probed from the dev machine (home IP is firewalled by BITS).
// This runs on Vercel (allowed IP), tries a fixed list of candidate ranking
// endpoints with the real BITS session, and reports which one answers — so we can
// build the real ranking sync. Host is hard-coded to api.swebowl.se; no arbitrary
// URL is accepted. DELETE once the endpoint is known.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Candidate = { path: string; method: 'GET' | 'POST'; params: Record<string, string | number> }

// Filters seen on bits.swebowl.se/ranking: Period, Nivå (level), Förening (club),
// Distrikt (district), Kön (gender). Try plausible names/param sets.
const CANDIDATES: Candidate[] = [
  { path: 'Ranking',                 method: 'GET',  params: { seasonId: 2026 } },
  { path: 'Ranking',                 method: 'GET',  params: {} },
  { path: 'ranking/GetRanking',      method: 'GET',  params: { seasonId: 2026 } },
  { path: 'ranking/GetRanking',      method: 'POST', params: { seasonId: 2026 } },
  { path: 'ranking/GetRankingList',  method: 'POST', params: { seasonId: 2026, take: 25, skip: 0, page: 1, pageSize: 25 } },
  { path: 'RankingList',             method: 'GET',  params: { seasonId: 2026 } },
  { path: 'Ranking/GetRanking',      method: 'GET',  params: { seasonId: 2026 } },
  { path: 'player/GetRanking',       method: 'GET',  params: { seasonId: 2026 } },
  { path: 'ranking/GetPlayerRanking', method: 'POST', params: { seasonId: 2026 } },
]

async function tryOne(c: Candidate, cookie: string) {
  try {
    const qs = new URLSearchParams(
      Object.entries(c.method === 'GET' ? c.params : {}).map(([k, v]) => [k, String(v)]).concat([['apiKey', BITS_KEY]]),
    )
    const url = `${BITS_API}/${c.path}?${qs}`
    const res = await fetch(url, {
      method: c.method,
      headers: { ...BASE_HEADERS, Cookie: cookie, ...(c.method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
      body: c.method === 'POST' ? JSON.stringify(c.params) : undefined,
      cache: 'no-store',
    })
    const text = await res.text()
    let shape = 'text'
    try {
      const j = JSON.parse(text)
      shape = Array.isArray(j) ? `array(${j.length})` : Array.isArray(j?.data) ? `{data:array(${j.data.length})}` : 'object'
    } catch { /* not json */ }
    return { ...c, status: res.status, shape, sample: text.slice(0, 400) }
  } catch (e) {
    return { ...c, status: 0, shape: 'error', sample: String(e).slice(0, 200) }
  }
}

async function run() {
  const cookie = await getSession()
  const results = []
  for (const c of CANDIDATES) results.push(await tryOne(c, cookie))
  return results
}

function authed(req: Request) {
  const s = process.env.CRON_SECRET
  return !!s && (req.headers.get('authorization') ?? '') === `Bearer ${s}`
}

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await run())
}
export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await run())
}
