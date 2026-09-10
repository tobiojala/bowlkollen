import { NextResponse } from 'next/server'
import { BASE_HEADERS, getSession } from '@/lib/bits-client'

// TEMPORARY discovery probe (2026-09-10): the BITS ranking API endpoint isn't
// documented and 9 guessed paths all 404'd. This fetches the BITS 2.0 ranking
// SPA + its JS bundles (from Vercel's allowed IP) and greps them for the real API
// URLs / endpoint names. Hosts are hard-coded to *.swebowl.se. DELETE once known.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE = 'https://bits.swebowl.se'

// Pull unique regex matches out of a blob, capped.
function grab(text: string, re: RegExp, cap = 40): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(re)) { out.add(m[0]); if (out.size >= cap) break }
  return [...out]
}

async function run() {
  const cookie = await getSession()
  const H = { ...BASE_HEADERS, Cookie: cookie, Accept: 'text/html,*/*' }

  const pageRes = await fetch(`${SITE}/ranking`, { headers: H, cache: 'no-store' })
  const html = await pageRes.text()

  // script src="..." (relative or absolute)
  const srcs = grab(html, /src="([^"]+\.js[^"]*)"/g).map(s => s.replace(/^src="|"$/g, ''))
  const absSrcs = srcs.map(s => (s.startsWith('http') ? s : `${SITE}${s.startsWith('/') ? '' : '/'}${s}`))

  const report: Record<string, unknown> = {
    pageStatus: pageRes.status,
    htmlBytes: html.length,
    scriptSrcs: absSrcs,
    inlineApiHits: grab(html, /https?:\/\/[a-z0-9.-]*swebowl\.se[^\s"'<>]*/gi),
  }

  // Fetch each bundle and grep for API hosts + ranking-ish endpoint paths.
  const bundleFindings: Record<string, { hosts: string[]; ranking: string[]; apiPaths: string[] }> = {}
  for (const url of absSrcs.slice(0, 6)) {
    try {
      const js = await (await fetch(url, { headers: { ...BASE_HEADERS, Cookie: cookie }, cache: 'no-store' })).text()
      bundleFindings[url] = {
        hosts:    grab(js, /https?:\/\/[a-z0-9.-]*swebowl\.se[^\s"'`]*/gi, 20),
        ranking:  grab(js, /["'`][^"'`]*[Rr]ank[A-Za-z]*[^"'`]*["'`]/g, 30),
        apiPaths: grab(js, /["'`]\/?api\/[A-Za-z0-9/_.-]+["'`]/g, 30),
      }
    } catch (e) { bundleFindings[url] = { hosts: [String(e).slice(0, 80)], ranking: [], apiPaths: [] } }
  }
  report.bundles = bundleFindings
  return report
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
