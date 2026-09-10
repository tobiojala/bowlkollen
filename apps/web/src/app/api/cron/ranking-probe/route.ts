import { NextResponse } from 'next/server'
import { BASE_HEADERS, getSession } from '@/lib/bits-client'

// TEMPORARY probe v3 (2026-09-10): find the Spelarprofil URL from the ranking
// grid's playerName column link (candidate server paths all 404'd). Return the
// playerName template + every href/route pattern. Host hard-coded. DELETE after.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE = 'https://bits.swebowl.se'

async function run() {
  const cookie = await getSession()
  const html = await (await fetch(`${SITE}/ranking`, {
    headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'text/html,*/*' }, cache: 'no-store',
  })).text()

  // Context around playerName (its column template holds the profile link).
  const playerNameCtx: string[] = []
  for (const m of html.matchAll(/playerName/g)) {
    const i = m.index ?? 0
    playerNameCtx.push(html.slice(Math.max(0, i - 80), i + 320).replace(/\s+/g, ' '))
    if (playerNameCtx.length >= 8) break
  }

  // Any href / route / :href / to= patterns anywhere in the page.
  const grab = (re: RegExp, cap = 40) => { const s = new Set<string>(); for (const m of html.matchAll(re)) { s.add(m[0]); if (s.size >= cap) break } return [...s] }
  return {
    playerNameContexts: playerNameCtx,
    hrefs:     grab(/href\s*[:=]\s*["'`][^"'`]{0,80}["'`]/g),
    routes:    grab(/["'`]\/[a-z][a-z0-9/_-]{2,60}["'`]/gi, 60),
    licInUrls: grab(/[A-Za-z0-9/_.?=-]*[Ll]ic[A-Za-z0-9/_.?=-]*/g, 40),
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
