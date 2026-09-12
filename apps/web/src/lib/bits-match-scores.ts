import 'server-only'
import { BASE_HEADERS, getSession, type BitsMatchScores } from './bits-client'
import { bitsFetch } from './bits-core'

// Per-match serie/player scores. Moved off the legacy api.swebowl.se/api/v1 tier
// (which now 403s us wholesale) to the SITE-host connector the live match-detail
// page itself calls: bits.swebowl.se/MiscFrontApiConnector/GetMatchScores?matchId=.
// Response shape is identical to the old API (series → boards → scores, scoreId
// "lblSerie{S}Table{T}Order{O}"), so parseTeamSeries/parsePlayerTotals/
// parseMatchDelmatchSlots in bits-client consume it unchanged. Because it's the
// live page's own call, it also returns partial data while a match is in progress.
const SITE = 'https://bits.swebowl.se'

export async function getMatchScores(matchId: number, retry = false): Promise<BitsMatchScores> {
  const cookie = await getSession()
  const res = await bitsFetch(`${SITE}/MiscFrontApiConnector/GetMatchScores?matchId=${matchId}`, {
    headers: { ...BASE_HEADERS, Cookie: cookie, Accept: 'application/json, */*' },
    cache: 'no-store',
  })
  if (res.status === 401 && !retry) return getMatchScores(matchId, true)
  if (!res.ok) throw new Error(`BITS GetMatchScores → HTTP ${res.status}`)
  return res.json() as Promise<BitsMatchScores>
}
