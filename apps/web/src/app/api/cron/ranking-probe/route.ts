import { NextResponse } from 'next/server'
import { BASE_HEADERS, getSession } from '@/lib/bits-client'

// TEMPORARY probe v5 (2026-09-10): confirm the monthly chart endpoint
// GET /MiscFrontApiConnector/PlayerDetailGraphData?licenseNumber=&type=2 (Month).
// Host hard-coded. DELETE once the ingestion is built.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE = 'https://bits.swebowl.se'
const LIC = 'M091007NOE01'

async function run() {
  const cookie = await getSession()
  const res = await fetch(`${SITE}/MiscFrontApiConnector/PlayerDetailGraphData?licenseNumber=${LIC}&type=2`, {
    headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'application/json, */*' }, cache: 'no-store',
  })
  const text = await res.text()
  let j: unknown = null
  try { j = JSON.parse(text) } catch { /* keep text */ }
  const arr = Array.isArray(j) ? j : []
  return { status: res.status, count: arr.length, keys: arr[0] ? Object.keys(arr[0] as object) : [], rows: arr, rawHead: j ? undefined : text.slice(0, 400) }
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
