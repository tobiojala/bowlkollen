import { NextResponse } from 'next/server'
import { BASE_HEADERS, getSession } from '@/lib/bits-client'

// TEMPORARY discovery probe (2026-09-10): found the ranking endpoint —
// POST https://bits.swebowl.se/MiscFrontApiConnector/GetPlayerRanking (site-side
// connector, session cookie, JSON body + Kendo paging → { data:[], total }).
// This calls it to confirm it works from Vercel and reveal the row fields
// (esp. the player id to join to bits_players). Host hard-coded. DELETE after.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE = 'https://bits.swebowl.se'

async function run() {
  const cookie = await getSession()
  const body = {
    matchType: '', Gender: '', leagueAndLevelIds: '', seasonTypeId: 1,
    clubId: 0, countyId: 0, fromDate: null, toDate: null, playerAgreement: true,
    skip: 0, take: 25, page: 1, pageSize: 25, sort: [{ field: 'rankPoints', dir: 'desc' }],
  }
  const res = await fetch(`${SITE}/MiscFrontApiConnector/GetPlayerRanking`, {
    method: 'POST',
    headers: { ...BASE_HEADERS, Cookie: cookie, 'Content-Type': 'application/json', Accept: 'application/json, */*' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await res.text()
  let parsed: unknown = null
  try { parsed = JSON.parse(text) } catch { /* keep text */ }
  const p = parsed as { data?: unknown[]; total?: number } | null
  const rows = Array.isArray(p?.data) ? p!.data : Array.isArray(parsed) ? (parsed as unknown[]) : []
  return {
    status: res.status,
    total: p?.total ?? null,
    rowCount: rows.length,
    rowKeys: rows[0] ? Object.keys(rows[0] as object) : [],
    sampleRows: rows.slice(0, 3),
    rawHead: parsed ? undefined : text.slice(0, 500),
  }
}

function authed(req: Request) {
  const s = process.env.CRON_SECRET
  return !!s && (req.headers.get('authorization') ?? '') === `Bearer ${s}`
}
export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await run())
}
export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await run())
}
