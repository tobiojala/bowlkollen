import type { Match, HonorEntry, TableRow } from './types'

const _now       = Date.now()
const _yesterday = new Date(_now - 86400000).toISOString().slice(0, 10)
const _twoDaysAgo = new Date(_now - 2 * 86400000).toISOString().slice(0, 10)
const _tomorrow  = new Date(_now + 86400000).toISOString().slice(0, 10)
const _in3h  = new Date(_now + 3 * 3600000).toISOString()
const _in7h  = new Date(_now + 7 * 3600000).toISOString()
const _in22h = new Date(_now + 22 * 3600000).toISOString()

export const MOCK_LIVE: Match[] = [
  {
    id: 'demo-live-1', date: new Date().toISOString(), status: 'live',
    division: 'Elitserien Herrar', home_score: 5, away_score: 4,
    home: { id: 'demo-t1', name: 'IK Hakarpspojkarna' },
    away: { id: 'demo-t2', name: 'Mariestads BK' },
    streams: [{ url: 'https://www.youtube.com/watch?v=demoLive1' }],
    gameNumber: 3, totalGames: 4,
    individualGames: { home: [234, 198, 267], away: [212, 245, 221] },
    highSeries: [{ playerName: 'Jesper Svensson', score: 267, team: 'home' }],
  },
  {
    id: 'demo-live-2', date: new Date().toISOString(), status: 'live',
    division: 'Elitserien Damer', home_score: 4, away_score: 4,
    home: { id: 'demo-t5', name: 'Örebro BK' },
    away: { id: 'demo-t6', name: 'Malmö BK' },
    streams: [
      { url: 'https://www.svtplay.se/demo' },
      { url: 'https://www.svenskbowling.tv/demo' },
    ],
    gameNumber: 4, totalGames: 4,
    individualGames: { home: [178, 223, 201, 256], away: [212, 198, 234, 214] },
    highSeries: [
      { playerName: 'Sara Holmberg', score: 256, team: 'home' },
      { playerName: 'Anna Karlsson', score: 234, team: 'away' },
    ],
  },
  {
    id: 'demo-live-3', date: new Date().toISOString(), status: 'live',
    division: 'Allsvenskan Herrar', home_score: 2, away_score: 4,
    home: { id: 'demo-t3', name: 'Göteborgs BK' },
    away: { id: 'demo-t4', name: 'Linköpings BK' },
    gameNumber: 2, totalGames: 4,
    individualGames: { home: [156, 178], away: [201, 234] },
    highSeries: [{ playerName: 'Marcus Lindgren', score: 234, team: 'away' }],
  },
]

export const MOCK_UPCOMING: Match[] = [
  {
    id: 'demo-up-1', date: _in3h, status: 'upcoming', division: 'Allsvenskan Herrar',
    home_score: null, away_score: null,
    home: { id: 'demo-t3', name: 'Göteborgs BK' },
    away: { id: 'demo-t4', name: 'Linköpings BK' },
    venue: 'Göteborg Bowlinghall', oilProfile: 'PBA Shark',
  },
  {
    id: 'demo-up-2', date: _in7h, status: 'upcoming', division: 'Allsvenskan Damer',
    home_score: null, away_score: null,
    home: { id: 'demo-t5', name: 'Örebro BK' },
    away: { id: 'demo-t6', name: 'Malmö BK' },
  },
  {
    id: 'demo-up-3', date: _in7h, status: 'upcoming', division: 'Div 1 Södra Herrar',
    home_score: null, away_score: null,
    home: { id: 'demo-t9', name: 'Halmstad BK' },
    away: { id: 'demo-t10', name: 'Helsingborg BK' },
  },
  {
    id: 'demo-up-4', date: _in22h, status: 'upcoming', division: 'Elitserien Damer',
    home_score: null, away_score: null,
    home: { id: 'demo-t7', name: 'Jönköpings BK' },
    away: { id: 'demo-t8', name: 'Borås BK' },
  },
  {
    id: 'demo-up-5', date: _tomorrow + 'T16:00:00', status: 'upcoming', division: 'SM-final Herrar',
    home_score: null, away_score: null,
    home: { id: 'demo-t1', name: 'IK Hakarpspojkarna' },
    away: { id: 'demo-t3', name: 'Göteborgs BK' },
  },
]

export const MOCK_RECENT: Match[] = [
  {
    id: 'demo-r-1', date: _yesterday + 'T19:00:00', status: 'completed',
    division: 'Elitserien Herrar', home_score: 6, away_score: 2,
    home: { id: 'demo-t1', name: 'IK Hakarpspojkarna' },
    away: { id: 'demo-t4', name: 'Linköpings BK' },
  },
  {
    id: 'demo-r-2', date: _yesterday + 'T19:00:00', status: 'completed',
    division: 'Allsvenskan Damer', home_score: 4, away_score: 4,
    home: { id: 'demo-t6', name: 'Malmö BK' },
    away: { id: 'demo-t7', name: 'Jönköpings BK' },
  },
  {
    id: 'demo-r-3', date: _yesterday + 'T17:00:00', status: 'completed',
    division: 'Div 1 Norra Herrar', home_score: 3, away_score: 5,
    home: { id: 'demo-t9', name: 'Halmstad BK' },
    away: { id: 'demo-t10', name: 'Helsingborg BK' },
  },
  {
    id: 'demo-r-4', date: _yesterday + 'T17:00:00', status: 'completed',
    division: 'Allsvenskan Herrar', home_score: 3, away_score: 5,
    home: { id: 'demo-t3', name: 'Göteborgs BK' },
    away: { id: 'demo-t2', name: 'Mariestads BK' },
  },
  {
    id: 'demo-r-5', date: _twoDaysAgo + 'T16:00:00', status: 'completed',
    division: 'Elitserien Damer', home_score: 5, away_score: 3,
    home: { id: 'demo-t8', name: 'Borås BK' },
    away: { id: 'demo-t5', name: 'Örebro BK' },
  },
  {
    id: 'demo-r-6', date: _twoDaysAgo + 'T14:00:00', status: 'completed',
    division: 'Allsvenskan Herrar', home_score: 7, away_score: 1,
    home: { id: 'demo-t2', name: 'Mariestads BK' },
    away: { id: 'demo-t9', name: 'Halmstad BK' },
  },
]

export const MOCK_HONOR: HonorEntry[] = [
  { playerName: 'Jesper Svensson', score: 300, matchId: 'demo-r-1', seriesTotal: 1064 },
  { playerName: 'Martin Larsen',   score: 289, matchId: 'demo-r-2', seriesTotal: 990 },
  { playerName: 'Marcus Lindgren', score: 279, matchId: 'demo-r-1' },
  { playerName: 'Sara Holmberg',   score: 256, matchId: 'demo-r-2' },
  { playerName: 'Jonas Persson',   score: 245, matchId: 'demo-r-3' },
  { playerName: 'Anna Karlsson',   score: 234, matchId: 'demo-r-4' },
  { playerName: 'Erik Svensson',   score: 224, matchId: 'demo-r-5' },
]

export const MOCK_TABLES: Record<string, TableRow[]> = {
  'Allsvenskan Herrar': [
    { rank: 1, teamId: 'demo-t17', teamName: 'Sundsvalls BK',     played: 10, won: 8, drawn: 1, lost: 1, points: 26 },
    { rank: 2, teamId: 'demo-t18', teamName: 'Skövde BK',         played: 10, won: 7, drawn: 0, lost: 3, points: 22 },
    { rank: 3, teamId: 'demo-t19', teamName: 'IFK Göteborg BK',   played: 10, won: 6, drawn: 1, lost: 3, points: 20 },
    { rank: 4, teamId: 'demo-t3',  teamName: 'Göteborgs BK',      played: 10, won: 5, drawn: 2, lost: 3, points: 18 },
    { rank: 5, teamId: 'demo-t20', teamName: 'Västervik BK',      played: 10, won: 5, drawn: 0, lost: 5, points: 15 },
    { rank: 6, teamId: 'demo-t21', teamName: 'Nacka BK',          played: 10, won: 3, drawn: 2, lost: 5, points: 11 },
    { rank: 7, teamId: 'demo-t22', teamName: 'Trollhättans BK',   played: 10, won: 2, drawn: 1, lost: 7, points:  8 },
    { rank: 8, teamId: 'demo-t23', teamName: 'Uddevalla BK',      played: 10, won: 1, drawn: 0, lost: 9, points:  3 },
  ],
  'Elitserien Herrar': [
    { rank: 1, teamId: 'demo-t1',  teamName: 'IK Hakarpspojkarna', played: 14, won: 11, drawn: 1, lost: 2,  points: 34 },
    { rank: 2, teamId: 'demo-t2',  teamName: 'Mariestads BK',      played: 14, won: 10, drawn: 1, lost: 3,  points: 31 },
    { rank: 3, teamId: 'demo-t3',  teamName: 'Göteborgs BK',       played: 14, won: 8,  drawn: 2, lost: 4,  points: 26 },
    { rank: 4, teamId: 'demo-t4',  teamName: 'Linköpings BK',      played: 14, won: 7,  drawn: 1, lost: 6,  points: 22 },
    { rank: 5, teamId: 'demo-t11', teamName: 'Örebro BK',          played: 14, won: 5,  drawn: 3, lost: 6,  points: 18 },
    { rank: 6, teamId: 'demo-t12', teamName: 'Lidköpings BSK',     played: 14, won: 4,  drawn: 2, lost: 8,  points: 14 },
    { rank: 7, teamId: 'demo-t13', teamName: 'Enköpings BS',       played: 14, won: 2,  drawn: 2, lost: 10, points:  8 },
    { rank: 8, teamId: 'demo-t14', teamName: 'Halmstad BK',        played: 14, won: 1,  drawn: 2, lost: 11, points:  5 },
  ],
  'Elitserien Damer': [
    { rank: 1, teamId: 'demo-t5',  teamName: 'Örebro BK',      played: 12, won: 9,  drawn: 2, lost: 1,  points: 29 },
    { rank: 2, teamId: 'demo-t6',  teamName: 'Malmö BK',       played: 12, won: 8,  drawn: 1, lost: 3,  points: 25 },
    { rank: 3, teamId: 'demo-t7',  teamName: 'Jönköpings BK',  played: 12, won: 7,  drawn: 2, lost: 3,  points: 23 },
    { rank: 4, teamId: 'demo-t8',  teamName: 'Borås BK',       played: 12, won: 5,  drawn: 1, lost: 6,  points: 16 },
    { rank: 5, teamId: 'demo-t9',  teamName: 'Halmstad BK',    played: 12, won: 4,  drawn: 2, lost: 6,  points: 14 },
    { rank: 6, teamId: 'demo-t10', teamName: 'Helsingborg BK', played: 12, won: 3,  drawn: 1, lost: 8,  points: 10 },
    { rank: 7, teamId: 'demo-t15', teamName: 'Sollentuna BK',  played: 12, won: 2,  drawn: 1, lost: 9,  points:  7 },
    { rank: 8, teamId: 'demo-t16', teamName: 'Uppsala BK',     played: 12, won: 1,  drawn: 0, lost: 11, points:  3 },
  ],
}

export const MOCK_MY_PLAYER = {
  name: 'Marcus Lindgren',
  team: 'Göteborgs BK',
  teamId: 'demo-t3',
  division: 'Allsvenskan Herrar',
  average: 194,
  lastScores: [178, 189, 234, 201, 212],
  teamRank: 4,
}

export const DIVISION_ZONES: Record<string, { promotionRanks?: number; playoffRanks?: number; relegationRanks: number; totalGames: number }> = {
  'Elitserien Herrar':  { playoffRanks: 4,   relegationRanks: 2, totalGames: 14 },
  'Elitserien Damer':   { playoffRanks: 4,   relegationRanks: 2, totalGames: 12 },
  'Allsvenskan Herrar': { promotionRanks: 2, relegationRanks: 2, totalGames: 14 },
  'Allsvenskan Damer':  { promotionRanks: 2, relegationRanks: 2, totalGames: 14 },
  'Div 1 Södra Herrar': { promotionRanks: 2, relegationRanks: 2, totalGames: 14 },
  'Div 1 Norra Herrar': { promotionRanks: 2, relegationRanks: 2, totalGames: 14 },
}
