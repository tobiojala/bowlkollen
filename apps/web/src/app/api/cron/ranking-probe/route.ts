import { NextResponse } from 'next/server'
import { BASE_HEADERS, getSession } from '@/lib/bits-client'

// TEMPORARY discovery probe (2026-09-10): the ranking endpoint isn't in the shared
// bundles (vue-bits.js is just bootstrap: formatAPIUrl/apiPostJSON/apiKey), so it
// lives in an INLINE <script> on the /ranking page. Return the inline scripts that
// mention ranking / the API helpers so we can read the exact endpoint + params.
// Runs from Vercel (home IP is firewalled by BITS). Host hard-coded. DELETE after.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE = 'https://bits.swebowl.se'

async function run() {
  const cookie = await getSession()
  const html = await (await fetch(`${SITE}/ranking`, {
    headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'text/html,*/*' }, cache: 'no-store',
  })).text()

  // Inline <script> blocks (no src=) whose body touches ranking or the API helpers.
  const scripts: string[] = []
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] || '', body = m[2] || ''
    if (/\bsrc=/i.test(attrs)) continue
    if (/rank|formatAPIUrl|apiPostJSON|transport|dataSource|api\/v1/i.test(body)) {
      scripts.push(body.trim().slice(0, 4000))
    }
  }

  // Also ±160-char context around any "rank"/"formatAPIUrl" token across the page.
  const ctx = new Set<string>()
  for (const m of html.matchAll(/[Rr]ank[A-Za-z]*|formatAPIUrl|apiPostJSON/g)) {
    const i = m.index ?? 0
    ctx.add(html.slice(Math.max(0, i - 160), i + 160).replace(/\s+/g, ' '))
    if (ctx.size >= 30) break
  }

  return { htmlBytes: html.length, inlineScriptHits: scripts.slice(0, 6), contexts: [...ctx] }
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
