/** Compare pages: team colors, motion, initials. */

import { shortName } from '@/lib/utils'
import { teamHue } from '@/lib/team-ui'

export const COMPARE_SPRING = { type: 'spring', stiffness: 280, damping: 28 } as const

export function compareTeamColors(name: string, dark: boolean) {
  const hue = teamHue(name)
  return {
    border: `hsl(${hue},50%,45%)`,
    bg: dark ? `hsl(${hue},40%,12%)` : `hsl(${hue},40%,92%)`,
  }
}

export function compareHeroGradient(
  teamBg: string,
  dark: boolean,
  side: 'left' | 'right' = 'left',
): string {
  const deg = side === 'left' ? 135 : 225
  const end = dark ? 'rgba(11,21,40,0.95)' : 'rgba(235,240,250,0.98)'
  return `linear-gradient(${deg}deg, ${teamBg} 0%, ${end} 100%)`
}

export type TeamCompareMatch = {
  id: string
  date: string
  home_score: number | null
  away_score: number | null
  home_team_id: string
  away_team_id: string
}

export type TeamCompareStats = {
  wins: number
  draws: number
  losses: number
  winRate: number
  avgMP: number
  bestMP: number
  matchesPlayed: number
}

export type TeamCompareMetric = {
  label: string
  key: keyof TeamCompareStats
  lowerIsBetter?: boolean
  format?: (v: number) => string
}

export const TEAM_COMPARE_METRICS: TeamCompareMetric[] = [
  { label: 'Vinstprocent', key: 'winRate', format: v => v + '%' },
  { label: 'Matcher vunna', key: 'wins' },
  { label: 'Snitt matchpoäng', key: 'avgMP', format: v => v.toFixed(1) },
  { label: 'Bästa matchpoäng', key: 'bestMP' },
  { label: 'Oavgjorda', key: 'draws' },
  { label: 'Matcher förlorade', key: 'losses', lowerIsBetter: true },
]

export function computeTeamCompareStats(
  matches: TeamCompareMatch[],
  teamId: string,
): TeamCompareStats {
  const done = matches.filter(m => m.home_score !== null && m.away_score !== null)
  const isHome = (m: TeamCompareMatch) => m.home_team_id === teamId
  const wins = done.filter(m =>
    isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!,
  ).length
  const losses = done.filter(m =>
    isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!,
  ).length
  const draws = done.length - wins - losses
  const scores = done.map(m => (isHome(m) ? m.home_score! : m.away_score!))
  const total = scores.reduce((a, b) => a + b, 0)
  return {
    wins,
    draws,
    losses,
    winRate: done.length > 0 ? Math.round((wins / done.length) * 100) : 0,
    avgMP: done.length > 0 ? Math.round((total / done.length) * 10) / 10 : 0,
    bestMP: scores.length > 0 ? Math.max(...scores) : 0,
    matchesPlayed: done.length,
  }
}

export function compareWinProbability(winRate1: number, winRate2: number) {
  const total = winRate1 + winRate2
  const prob1 =
    total === 0 ? 50 : Math.round(Math.min(95, Math.max(5, (winRate1 / total) * 100)))
  return { prob1, prob2: 100 - prob1 }
}

export function countMetricWins(
  stats1: TeamCompareStats,
  stats2: TeamCompareStats,
  metrics: TeamCompareMetric[] = TEAM_COMPARE_METRICS,
) {
  const t1Wins = metrics.filter(m => {
    const v1 = stats1[m.key] as number
    const v2 = stats2[m.key] as number
    return m.lowerIsBetter ? v1 < v2 : v1 > v2
  }).length
  const t2Wins = metrics.filter(m => {
    const v1 = stats1[m.key] as number
    const v2 = stats2[m.key] as number
    return m.lowerIsBetter ? v2 < v1 : v2 > v1
  }).length
  const overall = t1Wins > t2Wins ? 1 : t2Wins > t1Wins ? 2 : 0
  return { t1Wins, t2Wins, overall }
}

export function teamInitials(name: string): string {
  return shortName(name)
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}
