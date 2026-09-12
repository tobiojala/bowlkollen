import 'server-only'
import { BASE_HEADERS, getSession } from './bits-client'
import { bitsFetch } from './bits-core'

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
  const res = await bitsFetch(`${SITE}/MiscFrontApiConnector/GetPlayerRanking`, {
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

// One point of the Spelarprofil monthly chart. The chart's three lines are
// strength (Spelstyrka), yearRankPoints (Rankingpoäng — rolling year) and average
// (Snitt); xAxisText is the month label.
export type RankingGraphPoint = { xLabel: string; spelstyrka: number; ranking: number; snitt: number }

// A player's 12-month spelstyrka/ranking/snitt history — powers the profile's
// ranking curve. GET /MiscFrontApiConnector/PlayerDetailGraphData, type 2 = Month.
export async function getPlayerRankingGraph(licNbr: string): Promise<RankingGraphPoint[]> {
  const cookie = await getSession()
  const res = await bitsFetch(
    `${SITE}/MiscFrontApiConnector/PlayerDetailGraphData?licenseNumber=${encodeURIComponent(licNbr)}&type=2`,
    { headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'application/json, */*' }, cache: 'no-store' },
  )
  if (!res.ok) throw new Error(`BITS PlayerDetailGraphData → HTTP ${res.status}`)
  const rows = await res.json() as Array<{ strength: number; average: number; yearRankPoints: number; xAxisText: string }>
  return rows.map(r => ({ xLabel: r.xAxisText, spelstyrka: r.strength, ranking: r.yearRankPoints, snitt: r.average }))
}
