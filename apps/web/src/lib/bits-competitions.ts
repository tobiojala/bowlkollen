import 'server-only'
import { BITS_API, BITS_KEY, BASE_HEADERS, getSession } from './bits-client'

// BITS competition (tävling) endpoints. Unlike the seriespel endpoints these are
// POST with a Kendo-grid JSON body (apiKey still in the query string). The result
// chain, reverse-engineered from bits.swebowl.se/tavlingsresultat:
//   Season                         → all seasons
//   competition/GetClosedCompetitions?seasonId  → every finished competition
//   competition/GetCompetitionResult {resultId=<competition id>, resultRowNbr=N}
//                                    → player rows for class N (1..N until empty)
// resultId === the competition's own id; resultRowNbr walks the classes.

async function bitsPost<T>(path: string, body: Record<string, unknown>, retry = false): Promise<T> {
  const cookie = await getSession()
  const res = await fetch(`${BITS_API}/${path}?apiKey=${BITS_KEY}`, {
    method: 'POST',
    headers: { ...BASE_HEADERS, Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (res.status === 401 && !retry) return bitsPost(path, body, true)
  if (!res.ok) throw new Error(`BITS /${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

async function bitsGetJson<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const cookie = await getSession()
  const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), APIKey: BITS_KEY })
  const res = await fetch(`${BITS_API}/${path}?${qs}`, { headers: { ...BASE_HEADERS, Cookie: cookie }, cache: 'no-store' })
  if (!res.ok) throw new Error(`BITS /${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// ─── types ─────────────────────────────────────────────────────────────────────

export type BitsSeason = {
  seasonId:        number
  seasonName:      string
  seasonShortName: string
  seasonDateFrom:  string
  seasonDateTo:    string
}

export type BitsCompetition = {
  id:                number
  name:              string
  hall:              string | null
  hallCity:          string | null
  club:              string | null
  hallId:            number | null
  startDate:         string
  endDate:           string
  finalDate:         string
  season:            string | null
  competitionStatus: number
  competitionCanceled: boolean
}

export type BitsCompetitionResultRow = {
  resultLicNbr:    string | null
  resultPlace:     number
  resultRankPoint: number  // fractional strength points
  rankPoints:      number  // integer ranking points awarded
  resultHcp:       number
  licenseName:     string
  clubName:        string | null
  resultRowNbr:    number  // which class within the competition
  resultSortOrder: number
  classRounds:     number
  classHcp:        number
  classDesperado:  boolean
  // resultRoundResult0..10 + resultRoundNumber0..10 — per-round pins + games
  [key: `resultRoundResult${number}`]: number
  [key: `resultRoundNumber${number}`]: number
}

// ─── fetchers ────────────────────────────────────────────────────────────────

export async function getSeasons(): Promise<BitsSeason[]> {
  return bitsGetJson<BitsSeason[]>('Season', {})
}

/** Every finished competition in a season (id, name, hall, dates, status). */
export async function getClosedCompetitions(seasonId: number): Promise<BitsCompetition[]> {
  const rows = await bitsGetJson<BitsCompetition[]>('competition/GetClosedCompetitions', { seasonId })
  // The endpoint prepends a blank placeholder row (id 0) — drop it + any junk.
  return (rows ?? []).filter(c => c.id > 0 && !c.competitionCanceled)
}

type ResultEnvelope = { data?: BitsCompetitionResultRow[] } | BitsCompetitionResultRow[]

/** Player rows for one class (resultRowNbr) of a competition. Empty when the
 * class index is past the last class — the caller walks 1..N until empty. */
export async function getCompetitionResult(competitionId: number, resultRowNbr: number): Promise<BitsCompetitionResultRow[]> {
  const body = await bitsPost<ResultEnvelope>('competition/GetCompetitionResult', { resultId: competitionId, resultRowNbr })
  return Array.isArray(body) ? body : (body.data ?? [])
}

/** Pins + games summed across a result row's rounds → the player's competition average. */
export function competitionTotals(row: BitsCompetitionResultRow): { pins: number; games: number } {
  let pins = 0, games = 0
  for (let i = 0; i <= 10; i++) {
    pins  += Number(row[`resultRoundResult${i}` as keyof BitsCompetitionResultRow] ?? 0)
    games += Number(row[`resultRoundNumber${i}` as keyof BitsCompetitionResultRow] ?? 0)
  }
  return { pins, games }
}
