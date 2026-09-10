import 'server-only'
import { BASE_HEADERS, getSession } from './bits-client'

// Client for the BITS national ranking. Unlike the match/competition endpoints
// (api.swebowl.se/api/v1), ranking is a SITE-side connector on bits.swebowl.se
// that proxies with the browser session cookie — reverse-engineered from the
// /ranking page's inline Vue/Kendo grid. Returns the current rolling ranking
// sorted by rankPoints desc; rows key to bits_players by licenseNumber.
const SITE = 'https://bits.swebowl.se'

export type BitsRankingRow = {
  playerName:          string
  clubName:            string | null
  placeMale:           number
  placeFemale:         number
  rankPoints:          number
  average:             number
  averageBonusPoints:  number
  totalRounds:         number
  skillLevel:          number
  skillLevelAverage:   number
  hcp:                 number
  licenseNumber:       string | null
  gender:              string | null
  inActive:            boolean
}

// One page of the ranking. Body mirrors exactly what the /ranking grid POSTs
// (no season param — the connector returns the current rolling ranking).
export async function getPlayerRanking(
  skip: number,
  take: number,
  retry = false,
): Promise<{ rows: BitsRankingRow[]; total: number }> {
  const cookie = await getSession()
  const body = {
    matchType: '', Gender: '', leagueAndLevelIds: '', seasonTypeId: 1,
    clubId: 0, countyId: 0, fromDate: null, toDate: null, playerAgreement: true,
    skip, take, page: Math.floor(skip / take) + 1, pageSize: take,
    sort: [{ field: 'rankPoints', dir: 'desc' }],
  }
  const res = await fetch(`${SITE}/MiscFrontApiConnector/GetPlayerRanking`, {
    method: 'POST',
    headers: { ...BASE_HEADERS, Cookie: cookie, 'Content-Type': 'application/json', Accept: 'application/json, */*' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (res.status === 401 && !retry) return getPlayerRanking(skip, take, true)
  if (!res.ok) throw new Error(`BITS GetPlayerRanking → HTTP ${res.status}`)
  const j = await res.json() as { data?: BitsRankingRow[]; total?: number }
  return { rows: j.data ?? [], total: j.total ?? 0 }
}
