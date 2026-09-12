import { NextResponse } from 'next/server'
import { BASE_HEADERS, getSession } from '@/lib/bits-client'
import { bitsFetch } from '@/lib/bits-core'

// TEMP: discover the remaining site-host MiscFrontApiConnector endpoints (rosters,
// per-player results, clubs). Gated by a throwaway token; DELETE after migration.
const TOKEN = 'find-scores-9x2'
const SITE = 'https://bits.swebowl.se'
export const dynamic = 'force-dynamic'

// Real ids from Elitserien Herrar 2026 / match 3304266 (BK Full House).
const SCANS: Record<string, { conn: string; qs: string }[]> = {
  results: [
    { conn: 'GetMatchResults', qs: 'matchId=3304266&matchSchemeId=8M8BA' },
    { conn: 'GetMatchResult', qs: 'matchId=3304266' },
    { conn: 'ListMatchResults', qs: 'matchId=3304266' },
    { conn: 'GetMatchResultList', qs: 'matchId=3304266' },
    { conn: 'GetMatchPlayerResults', qs: 'matchId=3304266' },
    { conn: 'MatchResult', qs: 'matchId=3304266' },
  ],
  teams: [
    { conn: 'ListTeams', qs: 'divisionId=1&seasonId=2026' },
    { conn: 'GetTeams', qs: 'divisionId=1&seasonId=2026' },
    { conn: 'GetDivisionTeams', qs: 'divisionId=1&seasonId=2026' },
    { conn: 'GetStandings', qs: 'divisionId=1&seasonId=2026' },
    { conn: 'DivisionStandings', qs: 'divisionId=1&seasonId=2026' },
    { conn: 'GetTeamInfo', qs: 'teamId=184566&seasonId=2026' },
    { conn: 'ListTeamPlayers', qs: 'teamId=184566&seasonId=2026' },
    { conn: 'GetTeamPlayers', qs: 'teamId=184566&seasonId=2026' },
  ],
  clubs: [
    { conn: 'ListClubs', qs: 'seasonId=2026' },
    { conn: 'GetClubs', qs: 'seasonId=2026' },
    { conn: 'GetClubTeams', qs: 'clubId=6833&seasonId=2026' },
    { conn: 'ListClubTeams', qs: 'clubId=6833&seasonId=2026' },
  ],
}

function shapeOf(t: string): unknown {
  try {
    const j = JSON.parse(t)
    if (Array.isArray(j)) return { array: j.length, keys0: j[0] && typeof j[0] === 'object' ? Object.keys(j[0] as object).slice(0, 25) : typeof j[0] }
    if (j && typeof j === 'object') return { keys: Object.keys(j as object).slice(0, 30) }
    return typeof j
  } catch { return `non-json ${t.slice(0, 60)}` }
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  if (sp.get('probe') !== TOKEN) return NextResponse.json({ error: 'nope' }, { status: 404 })
  const cookie = await getSession()
  const one = async (conn: string, qs: string) => {
    const res = await bitsFetch(`${SITE}/MiscFrontApiConnector/${conn}?${qs}`, {
      headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'application/json, */*' }, cache: 'no-store',
    })
    const body = res.ok ? shapeOf(await res.text()) : null
    return { conn, qs, status: res.status, shape: body }
  }

  // Single dump: ?c=&p=
  const c = sp.get('c')
  if (c) {
    const res = await bitsFetch(`${SITE}/MiscFrontApiConnector/${c}?${sp.get('p') ?? ''}`, {
      headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'application/json, */*' }, cache: 'no-store',
    })
    return new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } })
  }

  // Scan a category: ?scan=results|teams|clubs
  const scan = sp.get('scan') ?? ''
  const list = SCANS[scan]
  if (!list) return NextResponse.json({ error: 'scan must be results|teams|clubs' }, { status: 400 })
  const out = []
  for (const { conn, qs } of list) out.push(await one(conn, qs))
  return NextResponse.json({ scan, results: out }, { status: 200 })
}
