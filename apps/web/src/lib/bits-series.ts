import 'server-only'
import { BASE_HEADERS, getSession, type BitsDivision, type BitsMatch, type BitsMatchResults } from './bits-client'
import { bitsFetch } from './bits-core'

// League structure (divisions) + fixtures (matches), moved off the dead
// api.swebowl.se/api/v1 onto the SITE-host connectors the /seriespel page uses:
//   Division?teamId=0&countyId=-1&seasonId=   → [{ divisionId, divisionName }]
//   ListMatches?divisionId=&seasonId=         → full schedule, superset of the old
//                                               BitsMatch shape (same field names)
// Same getSession cookie + hardened bitsFetch as scores/ranking.
const SITE = 'https://bits.swebowl.se'

async function siteGet<T>(conn: string, qs: string): Promise<T> {
  const cookie = await getSession()
  const res = await bitsFetch(`${SITE}/MiscFrontApiConnector/${conn}?${qs}`, {
    headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'application/json, */*' }, cache: 'no-store',
  })
  if (!res.ok) throw new Error(`BITS ${conn} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export async function getDivisions(seasonId = 2026): Promise<BitsDivision[]> {
  const rows = await siteGet<Array<{ divisionId: string | number; divisionName: string }>>('Division', `teamId=0&countyId=-1&seasonId=${seasonId}`)
  return rows.map((r) => ({ divisionId: Number(r.divisionId), divisionName: r.divisionName }))
}

export async function getMatchesByDivision(divisionId: number, seasonId = 2026): Promise<BitsMatch[]> {
  return siteGet<BitsMatch[]>('ListMatches', `divisionId=${divisionId}&seasonId=${seasonId}`)
}

// Per-player exact results (full name + license + per-serie line, split home/away).
// Same shape as the old api tier; matchSchemeId comes off the match row (trailing
// pad trimmed).
export async function getMatchResults(matchId: number, matchSchemeId: string): Promise<BitsMatchResults> {
  return siteGet<BitsMatchResults>('GetMatchResults', `matchId=${matchId}&matchSchemeId=${encodeURIComponent(matchSchemeId.trim())}`)
}
