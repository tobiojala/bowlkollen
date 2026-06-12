export const MATCHES = [
  { date: '14 sep', opp: 'Malmö BK',      result: 'W 6–2', games: [178, 192, 203, 187] },
  { date: '21 sep', opp: 'Göteborgs BK',  result: 'W 7–1', games: [201, 215, 198, 224] },
  { date: '28 sep', opp: 'Sthlm BK',      result: 'L 3–5', games: [189, 176, 201, 195] },
  { date: '5 okt',  opp: 'Uppsala BK',    result: 'D 4–4', games: [167, 189, 212, 198] },
  { date: '12 okt', opp: 'Västerås BK',   result: 'W 7–1', games: [223, 211, 198, 234] },
  { date: '19 okt', opp: 'Norrköping BK', result: 'W 5–3', games: [189, 201, 178, 215] },
  { date: '26 okt', opp: 'Linköping BK',  result: 'L 3–5', games: [198, 212, 167, 189] },
  { date: '2 nov',  opp: 'Göteborgs BK',  result: 'W 6–2', games: [215, 234, 198, 201] },
  { date: '9 nov',  opp: 'Malmö BK',      result: 'D 4–4', games: [189, 167, 201, 215] },
  { date: '16 nov', opp: 'Sthlm BK',      result: 'W 7–1', games: [234, 245, 212, 201] },
  { date: '23 nov', opp: 'Västerås BK',   result: 'W 6–2', games: [201, 189, 215, 234] },
  { date: '30 nov', opp: 'Uppsala BK',    result: 'W 8–0', games: [256, 234, 212, 245] },
  { date: '7 dec',  opp: 'Norrköping BK', result: 'W 8–0', games: [215, 234, 256, 267] },
  { date: '11 jan', opp: 'Linköping BK',  result: 'W 8–0', games: [234, 245, 256, 278] },
  { date: '18 jan', opp: 'Göteborgs BK',  result: 'W 7–1', games: [245, 267, 234, 256] },
]

export const RANKING_PTS = [3, 6, 4, 3, 7, 5, 3, 6, 4, 7, 6, 8, 8, 8, 7]
export const BK_PROGRESS = [72, 74, 73, 73, 76, 75, 74, 76, 75, 79, 78, 82, 84, 87, 87]
export const LAST_SEASON = [183, 192, 186, 194, 199, 195, 201, 197, 203, 208, 205, 211, 208, 215, 212]

export const CHALLENGES = [
  { icon: 'Target',  title: 'Konsistens',  desc: '±15p fem matcher i rad',   progress: 60,  cur: '3 / 5',  done: false },
  { icon: 'Flame',   title: 'Hetsviten',   desc: '5 spel i rad över 220',     progress: 80,  cur: '4 / 5',  done: false },
  { icon: 'Trophy',  title: 'Serierekord', desc: 'Nå 1 050 i serie',          progress: 96,  cur: '1 013',  done: false },
  { icon: 'Star',    title: '250-klubben', desc: '10 st 250+ denna säsong',   progress: 100, cur: '10/10',  done: true  },
]

export const DNA_HIGHLIGHTS = [
  { idx: 13, label: '278',       sublabel: 'Pers. rekord', color: '#7ab4e8', iconName: 'Star'   },
  { idx: 9,  label: '1:a i lag', sublabel: '',             color: '#f5c200', iconName: 'Trophy' },
  { idx: 4,  label: 'Streak',    sublabel: '',             color: '#5dcaa5', iconName: 'Flame'  },
]

// Simulated Elitserien Damer BK ratings (ascending) — 40 players
export const ELITSERIEN_BK_RATINGS = [
  62, 64, 65, 67, 68, 69, 70, 71, 72, 73, 74, 74, 75, 75, 76,
  76, 77, 77, 78, 78, 79, 80, 80, 81, 81, 82, 82, 83, 84, 84,
  85, 85, 85, 86, 86, 88, 89, 91, 94, 97,
]
export const PLAYER_BK_RATING = 87

// Home = true, Away = false, by match index
export const MATCH_HOME_AWAY: Record<number, boolean> = {
  0: false, 1: true,  2: false, 3: true,  4: false,
  5: true,  6: false, 7: true,  8: false, 9: true,
  10: false, 11: true, 12: false, 13: true, 14: false,
}

export const MOCK_FOLLOWERS = { followers: 142, following: 38 }

export const PLAYER_LEVEL = { level: 12, xp: 2340, nextLevelXp: 2500, title: 'Pro' }

export const ACHIEVEMENTS = [
  { icon: 'Star',      title: '250-klubben', sub: '10 × 250+',       earned: true,  near: false, color: '#f5c200' },
  { icon: 'Lightning', title: 'Personbästa', sub: '278 poäng',        earned: true,  near: false, color: '#7ab4e8' },
  { icon: 'Trophy',    title: 'Serierekord', sub: '1 013 / 1 050',    earned: false, near: true,  color: '#f5c200' },
  { icon: 'Fire',      title: 'Hetsviten',   sub: '5 i rad >220',      earned: false, near: true,  color: '#f5a623' },
  { icon: 'Target',    title: 'Precision',   sub: '±15p fem matcher',  earned: false, near: false, color: '#6b7a99' },
  { icon: 'Crown',     title: '300-klubben', sub: 'Bowla en 300',      earned: false, near: false, color: '#6b7a99' },
] as const

// Reactions on top-scoring matches (by match index)
export const MOCK_REACTIONS: Record<number, { flame: number; heart: number }> = {
  14: { flame: 18, heart: 24 },  // 1 002 total
  13: { flame: 31, heart: 42 },  // 1 013 + personal record (278)
  12: { flame: 12, heart: 17 },  // 972 total
  11: { flame: 8,  heart: 13 },  // 947 total
}

export const COLORS = {
  BG:      '#0b0d10',
  SURFACE: '#14171c',
  SURFACE2:'#1c2127',
  GOLD:    '#f5c200',
  BLUE:    '#7ab4e8',
  GREEN:   '#5dcaa5',
  RED:     '#e05555',
  MUTED:   'rgba(244,245,247,0.42)',
  BORDER:  'rgba(244,245,247,0.07)',
} as const
