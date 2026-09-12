import { NextResponse } from 'next/server'
import { BASE_HEADERS, getSession } from '@/lib/bits-client'
import { bitsFetch } from '@/lib/bits-core'

// TEMP: dump a site-host MiscFrontApiConnector endpoint's raw JSON while we
// reverse-engineer the new shapes. Gated by a throwaway token; DELETE this file
// once the divisions/matches migration is done.
const TOKEN = 'find-scores-9x2'
const SITE = 'https://bits.swebowl.se'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  if (sp.get('probe') !== TOKEN) return NextResponse.json({ error: 'nope' }, { status: 404 })
  const conn = sp.get('c')
  const qp = sp.get('p') ?? ''
  if (!conn) return NextResponse.json({ error: 'missing c' }, { status: 400 })
  const cookie = await getSession()
  const res = await bitsFetch(`${SITE}/MiscFrontApiConnector/${conn}?${qp}`, {
    headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'application/json, */*' }, cache: 'no-store',
  })
  return new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } })
}
