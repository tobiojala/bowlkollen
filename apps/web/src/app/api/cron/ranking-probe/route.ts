import { NextResponse } from 'next/server'
import { BASE_HEADERS, getSession } from '@/lib/bits-client'

// TEMPORARY probe v4 (2026-09-10): profile is /player-detail?licenseNumber=<lic>.
// Fetch it and extract the monthly chart (spelstyrka/rankingpoäng/snitt) data
// source + connectors. Host hard-coded. DELETE once the endpoint is known.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE = 'https://bits.swebowl.se'
const LIC = 'M091007NOE01'

async function run() {
  const cookie = await getSession()
  const res = await fetch(`${SITE}/player-detail?licenseNumber=${LIC}`, {
    headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'text/html,*/*' }, cache: 'no-store',
  })
  const html = await res.text()

  const connectors = [...new Set([...html.matchAll(/\/MiscFrontApiConnector\/[A-Za-z]+/g)].map(m => m[0]))]
  const scripts: string[] = []
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc=/i.test(m[1] || '')) continue
    const b = m[2] || ''
    if (/MiscFrontApiConnector|dataSource|categoryAxis|series\b|rankingpo|spelstyrk|chart/i.test(b)) scripts.push(b.trim().slice(0, 4500))
  }
  return { status: res.status, htmlBytes: html.length, connectors, scriptHits: scripts.slice(0, 6) }
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
