export type Match = {
  id: string; date: string; status: string; division: string
  home_score: number | null; away_score: number | null
  home: { id: string; name: string }; away: { id: string; name: string }
  streams?: { url: string }[]
  venue?: string; oilProfile?: string
  gameNumber?: number; totalGames?: number
  individualGames?: { home: number[]; away: number[] }
  highSeries?: { playerName: string; score: number; team: 'home' | 'away' }[]
}

export type HonorEntry = { playerName: string; score: number; matchId: string; seriesTotal?: number }

export type TableRow = {
  rank: number; teamId: string; teamName: string
  played: number; won: number; drawn: number; lost: number; points: number
}

export type StandingsMatch = {
  home_team_id: string; away_team_id: string
  home_score: number | null; away_score: number | null
  division: string
  home: { id: string; name: string }; away: { id: string; name: string }
}
