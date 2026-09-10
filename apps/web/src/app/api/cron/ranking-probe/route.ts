import { NextResponse } from 'next/server'
import { BASE_HEADERS, getSession } from '@/lib/bits-client'

// TEMPORARY discovery probe v2 (2026-09-10): the BITS Spelarprofil page has a
// MONTHLY chart of spelstyrka/rankingpoäng/snitt per player — a different endpoint
// than GetPlayerRanking (current list). Find the profile URL + its chart data
// source. Uses Noel's licence (M091007NOE01). Host hard-coded. DELETE after.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE = 'https://bits.swebowl.se'
const LIC = 'M091007NOE01'

const CANDIDATES = [
  `/player/${LIC}`, `/players/${LIC}`, `/spelarprofil/${LIC}`,
  `/licenser/spelarprofil/${LIC}`, `/license/${LIC}`, `/playerlicense/${LIC}`,
  `/licenser/${LIC}`, `/spelare/${LIC}`, `/playerprofile/${LIC}`,
]

async function run() {
  const cookie = await getSession()
  const H = { ...BASE_HEADERS, Cookie: cookie, Accept: 'text/html,*/*' }
  const results: Record<string, unknown> = {}

  for (const path of CANDIDATES) {
    try {
      const res = await fetch(`${SITE}${path}`, { headers: H, cache: 'no-store', redirect: 'manual' })
      const loc = res.headers.get('location')
      let hasChart = false, scripts: string[] = [], connectors: string[] = []
      if (res.status === 200) {
        const html = await res.text()
        hasChart = /ankingpo|kendo-chart|MiscFrontApiConnector|spelstyrk/i.test(html)
        if (hasChart) {
          for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
            if (/\bsrc=/i.test(m[1] || '')) continue
            const b = m[2] || ''
            if (/MiscFrontApiConnector|dataSource|chart|ankingpo|spelstyrk/i.test(b)) scripts.push(b.trim().slice(0, 3500))
          }
          connectors = [...new Set([...html.matchAll(/\/MiscFrontApiConnector\/[A-Za-z]+/g)].map(m => m[0]))]
        }
      }
      results[path] = { status: res.status, location: loc, hasChart, connectors, scripts: scripts.slice(0, 4) }
    } catch (e) { results[path] = { error: String(e).slice(0, 120) } }
  }
  return results
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
