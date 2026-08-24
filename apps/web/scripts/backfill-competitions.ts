#!/usr/bin/env npx tsx
/**
 * Backfill BITS competitions (tävlingar) + per-player results for the given
 * seasons. Standalone (does NOT import the server-only lib modules — same reason
 * as backfill-seasons.ts). Safe to re-run — everything upserts.
 *
 * Usage:  npx tsx scripts/backfill-competitions.ts [season ...]
 *   e.g.  npx tsx scripts/backfill-competitions.ts 2025 2026
 * Default seasons: 2025 2026.
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SEASONS = (process.argv.slice(2).map(Number).filter(Boolean))
const seasons = SEASONS.length ? SEASONS : [2025, 2026]

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const BITS_SITE = 'https://bits.swebowl.se'
const BITS_API = 'https://api.swebowl.se/api/v1'
const BITS_KEY = '62fcl8gPUMXSQGW1t2Y8mc2zeTk97vbd'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const H = { Origin: BITS_SITE, Referer: `${BITS_SITE}/tavlingsresultat`, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json, */*', 'User-Agent': UA }

let _cookie = '', _exp = 0
function setCookies(res: Response, jar: Record<string, string>) {
  const gsc = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie
  const lines = typeof gsc === 'function' ? gsc.call(res.headers) : [res.headers.get('set-cookie') ?? ''].filter(Boolean)
  for (const l of lines) { const s = l.split(';')[0].trim(); const e = s.indexOf('='); if (e > 0) jar[s.slice(0, e)] = s.slice(e + 1) }
}
async function session(): Promise<string> {
  if (_cookie && Date.now() < _exp) return _cookie
  const jar: Record<string, string> = {}
  setCookies(await fetch(`${BITS_SITE}/`, { headers: { 'User-Agent': UA } }), jar)
  setCookies(await fetch(`${BITS_SITE}/tavlingsresultat`, { headers: { 'User-Agent': UA, Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ') } }), jar)
  _cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '); _exp = Date.now() + 22 * 60 * 1000
  return _cookie
}
async function get<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const cookie = await session()
  const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), APIKey: BITS_KEY })
  const res = await fetch(`${BITS_API}/${path}?${qs}`, { headers: { ...H, Cookie: cookie } })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json() as Promise<T>
}
async function post<T>(path: string, body: unknown): Promise<T> {
  const cookie = await session()
  const res = await fetch(`${BITS_API}/${path}?APIKey=${BITS_KEY}`, { method: 'POST', headers: { ...H, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

type Comp = { id: number; name: string; hall: string | null; hallCity: string | null; hallId: number | null; club: string | null; startDate: string; endDate: string; finalDate: string; competitionStatus: number; competitionCanceled: boolean }
type ResultRow = { resultLicNbr: string | null; licenseName: string; clubName: string | null; resultPlace: number; rankPoints: number; resultRankPoint: number; resultHcp: number; resultRowNbr: number; resultSortOrder: number; classRounds: number; classHcp: number; classDesperado: boolean; [k: string]: unknown }
const isoDate = (s: string | null) => { const d = (s ?? '').slice(0, 10); return d && d !== '0001-01-01' ? d : null }
// BITS repeats rows (a competition can appear once per class); Postgres upsert
// rejects the same conflict key twice in one statement — so dedupe (last wins).
function dedupe<T>(rows: T[], key: (r: T) => string): T[] {
  const m = new Map<string, T>()
  for (const r of rows) m.set(key(r), r)
  return [...m.values()]
}
const totals = (r: ResultRow) => { let p = 0, g = 0; for (let i = 0; i <= 10; i++) { p += Number(r[`resultRoundResult${i}`] ?? 0); g += Number(r[`resultRoundNumber${i}`] ?? 0) } return { p, g } }

async function backfillSeason(seasonId: number) {
  const comps = (await get<Comp[]>('competition/GetClosedCompetitions', { seasonId })).filter(c => c.id > 0 && !c.competitionCanceled)
  console.log(`\n=== Season ${seasonId}: ${comps.length} competitions ===`)
  const compRows = dedupe(comps.map(c => ({
    bits_competition_id: c.id, season_id: seasonId, name: c.name, hall: c.hall, hall_city: c.hallCity,
    hall_id: c.hallId, club: c.club, start_date: isoDate(c.startDate), end_date: isoDate(c.endDate),
    final_date: isoDate(c.finalDate), status: c.competitionStatus, synced_at: new Date().toISOString(),
  })), r => String(r.bits_competition_id))
  const uniqComps = dedupe(comps, c => String(c.id))
  for (let i = 0; i < compRows.length; i += 100) {
    const { error } = await db.from('bits_competitions').upsert(compRows.slice(i, i + 100), { onConflict: 'bits_competition_id' })
    if (error) throw new Error(error.message)
  }

  let done = 0, rowsTotal = 0
  for (const c of uniqComps) {
    let rows: Record<string, unknown>[] = []
    for (let rn = 1; rn <= 40; rn++) {
      const env = await post<{ data?: ResultRow[] } | ResultRow[]>('competition/GetCompetitionResult', { resultId: c.id, resultRowNbr: rn })
      const classRows = Array.isArray(env) ? env : (env.data ?? [])
      if (!classRows.length) break
      for (const r of classRows) {
        const { p, g } = totals(r)
        rows.push({
          bits_competition_id: c.id, result_row_nbr: r.resultRowNbr, result_sort_order: r.resultSortOrder,
          lic_nbr: r.resultLicNbr?.trim() || null, player_name: r.licenseName ?? null, club_name: r.clubName ?? null,
          place: r.resultPlace ?? null, rank_points: r.rankPoints ?? null, strength_points: r.resultRankPoint ?? null,
          hcp: r.resultHcp ?? null, total_pins: p, total_games: g, class_rounds: r.classRounds ?? null,
          class_hcp: r.classHcp ?? null, class_desperado: r.classDesperado ?? null, synced_at: new Date().toISOString(),
        })
      }
    }
    rows = dedupe(rows, r => `${r.result_row_nbr}-${r.result_sort_order}`)
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await db.from('bits_competition_results').upsert(rows.slice(i, i + 200), { onConflict: 'bits_competition_id,result_row_nbr,result_sort_order' })
      if (error) throw new Error(error.message)
    }
    await db.from('bits_competitions').update({ results_synced: true }).eq('bits_competition_id', c.id)
    rowsTotal += rows.length; done++
    if (done % 25 === 0) console.log(`  ${done}/${comps.length} comps, ${rowsTotal} result rows`)
  }
  console.log(`  season ${seasonId} done: ${done} comps, ${rowsTotal} result rows`)
}

async function main() {
  for (const s of seasons) await backfillSeason(s)
  console.log('\nBackfill done.')
}
main().catch(e => { console.error(e); process.exit(1) })
