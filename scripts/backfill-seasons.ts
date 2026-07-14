#!/usr/bin/env npx tsx
/**
 * Backfill historical BITS seasons (divisions + matches) so team pages have
 * real history to fall back on before this season's own results build up.
 *
 * Standalone — does NOT import lib/bits-client or lib/bits-sync. Both are
 * `import 'server-only'` guarded, which is a Next.js build-time alias, not a
 * real npm package; importing them outside the Next bundler throws
 * MODULE_NOT_FOUND. This duplicates the minimal session/fetch/upsert logic
 * instead (same convention as the other one-off scripts in this folder).
 *
 * Safe to re-run — everything upserts.
 * Run: npx tsx scripts/backfill-seasons.ts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const SEASONS = [2021, 2022, 2023, 2024, 2025]

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const BITS_SITE = 'https://bits.swebowl.se'
const BITS_API  = 'https://api.swebowl.se/api/v1'
const BITS_KEY  = '62fcl8gPUMXSQGW1t2Y8mc2zeTk97vbd'
const UA        = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const BASE_HEADERS = {
  Origin:             BITS_SITE,
  Referer:            `${BITS_SITE}/seriespel`,
  'X-Requested-With': 'XMLHttpRequest',
  Accept:             'application/json, text/javascript, */*; q=0.01',
  'Accept-Language':  'sv-SE,sv;q=0.9,en;q=0.7',
  'User-Agent':       UA,
}

type Session = { cookie: string; expiresAt: number }
let _session: Session | null = null

function extractSetCookies(res: Response): Record<string, string> {
  const jar: Record<string, string> = {}
  const getSetCookie = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie
  const lines: string[] = typeof getSetCookie === 'function'
    ? getSetCookie.call(res.headers)
    : [res.headers.get('set-cookie') ?? ''].filter(Boolean)
  for (const line of lines) {
    const segment = line.split(';')[0].trim()
    const eq = segment.indexOf('=')
    if (eq > 0) jar[segment.slice(0, eq).trim()] = segment.slice(eq + 1).trim()
  }
  return jar
}

function jarToString(jar: Record<string, string>): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function getSession(): Promise<string> {
  if (_session && Date.now() < _session.expiresAt) return _session.cookie

  const jar: Record<string, string> = {}
  const r1 = await fetch(`${BITS_SITE}/`, {
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.9', 'Accept-Language': 'sv-SE,sv;q=0.9' },
    redirect: 'follow',
  })
  Object.assign(jar, extractSetCookies(r1))

  const r2 = await fetch(`${BITS_SITE}/seriespel`, {
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.9', Cookie: jarToString(jar), Referer: `${BITS_SITE}/` },
    redirect: 'follow',
  })
  Object.assign(jar, extractSetCookies(r2))

  const cookie = jarToString(jar)
  _session = { cookie, expiresAt: Date.now() + 22 * 60 * 1000 }
  return cookie
}

async function bitsGet<T>(path: string, params: Record<string, string | number> = {}, retry = false): Promise<T> {
  const cookie = await getSession()
  const entries = Object.entries(params).map(([k, v]) => [k, String(v)] as [string, string])
  const qs = new URLSearchParams([...entries, ['apiKey', BITS_KEY]])
  const url = `${BITS_API}/${path}?${qs}`

  const res = await fetch(url, { headers: { ...BASE_HEADERS, Cookie: cookie } })

  if (res.status === 401 && !retry) { _session = null; return bitsGet(path, params, true) }
  if (!res.ok) throw new Error(`BITS /${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

type BitsDivision = { divisionId: number; divisionName: string }
type BitsMatch = {
  matchId: number; matchDate: string; matchRoundId: number
  matchHomeTeamId: number; matchHomeTeamName: string
  matchAwayTeamId: number; matchAwayTeamName: string
  matchHomeTeamScore: number; matchAwayTeamScore: number
  matchHomeTeamResult: number; matchAwayTeamResult: number
  matchHallName: string | null; matchHallCity: string | null
  matchDivisionId: number; matchDivisionName: string
  matchOilPatternName: string | null; matchSeason: number
  matchFinished: boolean; matchSchemeId: string | null
}

async function syncDivisions(seasonId: number): Promise<BitsDivision[]> {
  const divs = await bitsGet<BitsDivision[]>('Division', { seasonId })
  const rows = divs.map(d => ({
    bits_division_id: Number(d.divisionId), season_id: seasonId, name: d.divisionName,
    synced_at: new Date().toISOString(),
  }))
  if (rows.length) {
    const { error } = await db.from('bits_divisions').upsert(rows, { onConflict: 'bits_division_id,season_id' })
    if (error) throw new Error(error.message)
  }
  return divs
}

async function syncMatchesForDivision(divisionId: number, seasonId: number): Promise<number> {
  const matches = await bitsGet<BitsMatch[]>('Match', { divisionId, seasonId })
  if (!matches.length) return 0

  const rows = matches.map(m => ({
    bits_match_id:      m.matchId,
    season_id:          m.matchSeason || seasonId,
    bits_division_id:   m.matchDivisionId,
    division_name:      m.matchDivisionName,
    match_date:         m.matchDate.slice(0, 10),
    home_bits_team_id:  m.matchHomeTeamId,
    away_bits_team_id:  m.matchAwayTeamId,
    home_team_name:     m.matchHomeTeamName,
    away_team_name:     m.matchAwayTeamName,
    home_score:         m.matchHomeTeamScore || null,
    away_score:         m.matchAwayTeamScore || null,
    home_result:        m.matchHomeTeamResult,
    away_result:        m.matchAwayTeamResult,
    round_id:           m.matchRoundId,
    hall_name:          m.matchHallName,
    hall_city:          m.matchHallCity,
    oil_pattern:        m.matchOilPatternName,
    is_finished:        m.matchFinished,
    match_scheme_id:    m.matchSchemeId,
    synced_at:          new Date().toISOString(),
  }))

  const BATCH = 100
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await db.from('bits_matches').upsert(rows.slice(i, i + BATCH), { onConflict: 'bits_match_id' })
    if (error) throw new Error(error.message)
  }
  return rows.length
}

async function main() {
  for (const seasonId of SEASONS) {
    console.log(`\n=== Season ${seasonId} ===`)
    const divs = await syncDivisions(seasonId)
    console.log(`  divisions: ${divs.length}`)

    let totalMatches = 0
    for (const d of divs) {
      const n = await syncMatchesForDivision(d.divisionId, seasonId)
      totalMatches += n
      if (n > 0) console.log(`  ${d.divisionName}: ${n} matches`)
    }
    console.log(`  season ${seasonId} total: ${totalMatches} matches across ${divs.length} divisions`)
  }
  console.log('\nBackfill done.')
}

main().catch(e => { console.error(e); process.exit(1) })
