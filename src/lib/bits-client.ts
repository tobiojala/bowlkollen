import 'server-only'

const BITS_SITE = 'https://bits.swebowl.se'
const BITS_API  = 'https://api.swebowl.se/api/v1'
const BITS_KEY  = '62fcl8gPUMXSQGW1t2Y8mc2zeTk97vbd'
const UA        = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const BASE_HEADERS = {
  Origin:            BITS_SITE,
  Referer:           `${BITS_SITE}/seriespel`,
  'X-Requested-With': 'XMLHttpRequest',
  Accept:            'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.7',
  'User-Agent':      UA,
}

// ─── API types ────────────────────────────────────────────────────────────────

export type BitsDivision = {
  divisionId:   number
  divisionName: string
}

export type BitsClub = {
  clubId:      number
  clubName:    string
  clubLogoUrl: string | null
  countyId:    number | null
  countyName:  string | null
  hallId:      number | null
  hallName:    string | null
  isActive:    boolean
  isPlayBowl:  boolean
}

export type BitsTeam = {
  teamId:           number
  teamName:         string
  teamAlias:        string | null
  teamClubId:       number | null
  teamDivisionId:   number | null
  teamDivisionName: string | null
  teamType:         number | null
  teamTypeDesc:     string | null
}

export type BitsMatch = {
  matchId:              number
  matchDate:            string
  matchDateTime:        string
  matchRoundId:         number
  matchHomeTeamId:      number
  matchHomeTeamName:    string
  matchHomeTeamAlias:   string
  matchAwayTeamId:      number
  matchAwayTeamName:    string
  matchAwayTeamAlias:   string
  matchHomeTeamScore:   number
  matchAwayTeamScore:   number
  matchHomeTeamResult:  number
  matchAwayTeamResult:  number
  matchHallId:          number | null
  matchHallName:        string | null
  matchHallCity:        string | null
  matchDivisionId:      number
  matchDivisionName:    string
  matchOilPatternName:  string | null
  matchSeason:          number
  matchHasBeenPlayed:   boolean
  matchFinished:        boolean
  matchVsTeams:         string
  matchVsResult:        string | null
  matchStatus:          number
  homeTeamClubId:       number
  awayTeamClubId:       number
  matchSchemeId:        string | null
}

export type BitsPlayerScore = {
  playerName: string
  score:      string
  laneScore:  string
  scoreId:    string
}

export type BitsPlayerRecord = {
  licNbr:            string
  firstName:         string
  surName:           string
  clubName:          string
  licTypeName:       string
  licenceSkillLevel: number
  licenceAverage:    number
}

export type BitsPlayerPage = {
  total: number
  data:  BitsPlayerRecord[]
}

export type BitsPlayerProfileDetail = {
  firstName:               string
  surName:                 string
  licenseNumber:           string
  clubName:                string
  agreementFirstClubName:  string | null
  agreementFirstClubId:    number | null
  agreementSecondClubName: string | null
  agreementSecondClubId:   number | null
}

// matchResult/GetMatchResults — BITS' own authoritative per-player identity
// for a match: exact license number + full name + per-serie line, already
// split home/away. This is what powers BITS' own "highest score" table.
// Requires matchSchemeId (returned alongside matches by the Match endpoint).
export type BitsMatchResultPlayer = {
  player:                string   // "Adam Andersson (M070592ADA01)"
  licNbr:                string
  homeOrAwayTeam:         'H' | 'A'
  result1:                number
  result2:                number
  result3:                number
  result4:                number
  totalResult:            number
  totalResultWithoutHcp:  number
  totalSeries:            number   // 0 when the player was listed but didn't play
  place:                  number
}

export type BitsMatchResults = {
  playerListHome:    BitsMatchResultPlayer[]
  playerListAway:    BitsMatchResultPlayer[]
  homeTeamSkillLevel: number
  awayTeamSkillLevel: number
}

export type BitsBoard = {
  scores:    BitsPlayerScore[]
  boardId:   string | null
  boardName: string | null
}

export type BitsSerie = {
  boards:    BitsBoard[]
  serieId:   string | null
  serieName: string | null
}

export type BitsMatchScores = {
  series:     BitsSerie[]
  serieNames: string[]
  boardNames: string[]
}

// ─── session management ───────────────────────────────────────────────────────

type Session = { cookie: string; expiresAt: number }
let _session: Session | null = null

function extractSetCookies(res: Response): Record<string, string> {
  const jar: Record<string, string> = {}
  // Node 18+ has getSetCookie(); older runtimes return a joined string
  const lines: string[] = typeof (res.headers as unknown as Record<string, unknown>).getSetCookie === 'function'
    ? ((res.headers as unknown as { getSetCookie(): string[] }).getSetCookie())
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

  // Visiting /seriespel initialises the Kendo Grid session that unlocks the API tier
  const r2 = await fetch(`${BITS_SITE}/seriespel`, {
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.9', Cookie: jarToString(jar), Referer: `${BITS_SITE}/` },
    redirect: 'follow',
  })
  Object.assign(jar, extractSetCookies(r2))

  const cookie = jarToString(jar)
  _session = { cookie, expiresAt: Date.now() + 22 * 60 * 1000 }
  return cookie
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function bitsGet<T>(
  path:   string,
  params: Record<string, string | number> = {},
  retry = false,
): Promise<T> {
  const cookie = await getSession()
  const entries = Object.entries(params).map(([k, v]) => [k, String(v)] as [string, string])
  const qs = new URLSearchParams([...entries, ['apiKey', BITS_KEY]])
  const url = `${BITS_API}/${path}?${qs}`

  const res = await fetch(url, {
    headers: { ...BASE_HEADERS, Cookie: cookie },
    // Tell Next.js not to cache these dynamic data calls
    cache: 'no-store',
  })

  if (res.status === 401 && !retry) {
    _session = null
    return bitsGet(path, params, true)
  }

  if (!res.ok) throw new Error(`BITS /${path} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function getDivisions(seasonId = 2025): Promise<BitsDivision[]> {
  return bitsGet<BitsDivision[]>('Division', { seasonId })
}

export async function getClubs(seasonId = 2025): Promise<BitsClub[]> {
  return bitsGet<BitsClub[]>('Club', { seasonId })
}

export async function getTeamsByClub(clubId: number, seasonId = 2025): Promise<BitsTeam[]> {
  return bitsGet<BitsTeam[]>('Team', { clubId, seasonId })
}

export async function getMatchesByDivision(divisionId: number, seasonId = 2025): Promise<BitsMatch[]> {
  return bitsGet<BitsMatch[]>('Match', { divisionId, seasonId })
}

export async function getMatchScores(matchId: number): Promise<BitsMatchScores> {
  return bitsGet<BitsMatchScores>('matchResult/GetMatchScores', { matchId })
}

export async function getMatchResults(matchId: number, matchSchemeId: string): Promise<BitsMatchResults> {
  return bitsGet<BitsMatchResults>('matchResult/GetMatchResults', { matchId, matchSchemeId })
}

export async function getPlayersPage(skip: number, take = 200): Promise<BitsPlayerPage> {
  return bitsGet<BitsPlayerPage>('Player', { skip, take })
}

export async function getPlayerProfileDetail(
  licenseNumber: string,
  seasonId = 2025,
): Promise<BitsPlayerProfileDetail> {
  return bitsGet<BitsPlayerProfileDetail>('player/PlayerProfileDetail', { licenseNumber, seasonId })
}

// ─── parse utilities (pure — can be unit-tested without network calls) ────────

export type ParsedTeamSeries = { teamA: number[]; teamB: number[] }

/** Extract per-serie pin totals for both teams from a GetMatchScores response. */
export function parseTeamSeries(scores: BitsMatchScores): ParsedTeamSeries {
  const teamA: number[] = []
  const teamB: number[] = []

  for (const serie of scores.series) {
    // The outer `boards` array splits evenly in half: first half = home team's
    // board groups, second half = away team's. Verified against known pin
    // totals across multiple matches/divisions (2-board and 4-board formats).
    // It is NOT the inner scores[] index — that's the rotating physical table.
    const homeBoardCount = Math.floor(serie.boards.length / 2)
    let a = 0; let b = 0
    serie.boards.forEach((board, boardIdx) => {
      const sum = board.scores.reduce((t, s) => t + (parseInt(s.score, 10) || 0), 0)
      if (boardIdx < homeBoardCount) a += sum
      else b += sum
    })
    teamA.push(a)
    teamB.push(b)
  }

  return { teamA, teamB }
}

export type ParsedPlayer = { name: string; games: number[]; total: number; isHomeTeam: boolean }

/** Extract per-player game scores from a GetMatchScores response. */
export function parsePlayerTotals(scores: BitsMatchScores): ParsedPlayer[] {
  const map = new Map<string, { games: number[]; isHomeTeam: boolean }>()

  scores.series.forEach((serie, serieIdx) => {
    const homeBoardCount = Math.floor(serie.boards.length / 2)
    serie.boards.forEach((board, boardIdx) => {
      board.scores.forEach(ps => {
        const name = ps.playerName?.trim()
        if (!name) return
        const val = parseInt(ps.score, 10)
        if (isNaN(val) || val <= 0) return

        const isHomeTeam = boardIdx < homeBoardCount
        const entry = map.get(name)
        if (entry) {
          while (entry.games.length <= serieIdx) entry.games.push(0)
          entry.games[serieIdx] = val
        } else {
          const games = new Array<number>(serieIdx + 1).fill(0)
          games[serieIdx] = val
          map.set(name, { games, isHomeTeam })
        }
      })
    })
  })

  return Array.from(map.entries()).map(([name, { games, isHomeTeam }]) => ({
    name,
    games,
    total: games.reduce((a, b) => a + b, 0),
    isHomeTeam,
  }))
}

export type ParsedMatchResultPlayer = {
  licNbr:      string
  fullName:    string
  isHomeTeam:  boolean
  series:      number[]   // trimmed to totalSeries — no trailing zeros for unplayed series
  total:       number
}

/**
 * Extract exact per-player results from a GetMatchResults response — full
 * name + license number with zero ambiguity, straight from BITS' own
 * authoritative source. Players listed but who didn't actually play
 * (totalSeries === 0, e.g. an unused reserve) are skipped.
 */
export function parseMatchResults(results: BitsMatchResults): ParsedMatchResultPlayer[] {
  const rows: ParsedMatchResultPlayer[] = []
  for (const list of [results.playerListHome, results.playerListAway]) {
    for (const p of list ?? []) {
      if (!p.totalSeries) continue
      const suffix = ` (${p.licNbr})`
      const fullName = p.player.endsWith(suffix) ? p.player.slice(0, -suffix.length).trim() : p.player.trim()
      rows.push({
        licNbr:     p.licNbr,
        fullName,
        isHomeTeam: p.homeOrAwayTeam === 'H',
        series:     [p.result1, p.result2, p.result3, p.result4].slice(0, p.totalSeries),
        total:      p.totalResult,
      })
    }
  }
  return rows
}
