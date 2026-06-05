/** Matchpulsen page helpers and demo data. */

import { cn } from '@/lib/cn'

export type PulsMatch = {
  id: string
  date: string
  status: string
  division: string
  home_score: number | null
  away_score: number | null
  home: { id: string; name: string }
  away: { id: string; name: string }
  streams?: { url: string }[]
  gameNumber?: number
  totalGames?: number
  individualGames?: { home: number[]; away: number[] }
  highSeries?: { playerName: string; score: number; team: 'home' | 'away' }[]
}

export const PULS_DEMO = true

export const PULS_MOCK_LIVE: PulsMatch[] = [
  {
    id: 'demo-live-1',
    date: new Date().toISOString(),
    status: 'live',
    division: 'Elitserien Herrar',
    home_score: 5,
    away_score: 4,
    home: { id: 'demo-t1', name: 'IK Hakarpspojkarna' },
    away: { id: 'demo-t2', name: 'Mariestads BK' },
    streams: [{ url: 'https://www.youtube.com/watch?v=demoLive1' }],
    gameNumber: 3,
    totalGames: 4,
    individualGames: { home: [234, 198, 267], away: [212, 245, 221] },
    highSeries: [{ playerName: 'Jesper Svensson', score: 267, team: 'home' }],
  },
  {
    id: 'demo-live-2',
    date: new Date().toISOString(),
    status: 'live',
    division: 'Elitserien Damer',
    home_score: 4,
    away_score: 4,
    home: { id: 'demo-t5', name: 'Örebro BK' },
    away: { id: 'demo-t6', name: 'Malmö BK' },
    streams: [
      { url: 'https://www.svtplay.se/demo' },
      { url: 'https://www.svenskbowling.tv/demo' },
    ],
    gameNumber: 4,
    totalGames: 4,
    individualGames: { home: [178, 223, 201, 256], away: [212, 198, 234, 214] },
    highSeries: [
      { playerName: 'Sara Holmberg', score: 256, team: 'home' },
      { playerName: 'Anna Karlsson', score: 234, team: 'away' },
    ],
  },
  {
    id: 'demo-live-3',
    date: new Date().toISOString(),
    status: 'live',
    division: 'Allsvenskan Herrar',
    home_score: 2,
    away_score: 4,
    home: { id: 'demo-t3', name: 'Göteborgs BK' },
    away: { id: 'demo-t4', name: 'Linköpings BK' },
    gameNumber: 2,
    totalGames: 4,
    individualGames: { home: [156, 178], away: [201, 234] },
    highSeries: [{ playerName: 'Marcus Lindgren', score: 234, team: 'away' }],
  },
]

export const PULS_BASELINE = 185

export const pulsSectionDivider = 'border-t border-black/6 pt-3 dark:border-white/6'

export function pulsGameBarClass(g: number, isLatest: boolean) {
  const isGold = g >= 250
  const isGood = g >= PULS_BASELINE
  return cn(
    'w-4 rounded-[3px]',
    isGold && 'bg-gold shadow-[0_0_6px_rgba(245,194,0,0.5)]',
    !isGold && isGood && 'bg-[#38a088]',
    !isGold && !isGood && 'bg-dark-muted',
    isLatest ? 'opacity-100' : 'opacity-60',
  )
}

export function pulsGameScoreClass(g: number, isLatest: boolean) {
  const isGold = g >= 250
  const isGood = g >= PULS_BASELINE
  return cn(
    'text-[8px] tabular-nums',
    isLatest ? 'font-extrabold' : 'font-semibold',
    isGold && 'text-gold',
    !isGold && isGood && 'text-[#38a088]',
    !isGold && !isGood && 'text-dark-muted',
  )
}

export function pulsHighSeriesChipClass(score: number) {
  return cn(
    'flex items-center gap-1.5 rounded-md border px-2.5 py-1.25 text-[10px] font-bold',
    score >= 250
      ? 'border-gold/28 bg-gold/10 text-gold'
      : 'border-[#38a088]/28 bg-[#38a088]/10 text-[#38a088]',
  )
}

export function tensionScore(m: PulsMatch): number {
  if (m.home_score === null) return 0
  const h = m.home_score
  const a = m.away_score!
  const diff = Math.abs(h - a)
  const total = h + a
  if (total === 0) return 0
  const closeness = 1 - diff / Math.max(total, 1)
  const progress = Math.min((m.gameNumber ?? 1) / (m.totalGames ?? 4), 1)
  return closeness * (0.6 + 0.4 * progress)
}

export function tensionInsight(m: PulsMatch): string {
  if (m.home_score === null) return ''
  const h = m.home_score
  const a = m.away_score!
  const diff = Math.abs(h - a)
  const gn = m.gameNumber ?? 1
  const tg = m.totalGames ?? 4
  const remaining = tg - gn
  const isTied = h === a
  if (isTied && remaining <= 0) return 'Oavgjort · Slutspelet avgör'
  if (isTied && remaining === 1) return 'Kvitterat · Avgörande spelet'
  if (isTied) return `Kvitterat · Spel ${gn} av ${tg}`
  if (remaining <= 0) return `${diff} poäng isär · Slutspelet`
  if (remaining === 1 && diff <= 2) return `${diff} poäng · Avgörande spelet!`
  if (remaining === 1) return `${diff} poäng · Sista spelet`
  return `${diff} poäng isär · Spel ${gn} av ${tg}`
}

export function tensionColor(score: number): string {
  if (score > 0.85) return '#f5c200'
  if (score > 0.6) return '#38a088'
  return ''
}

export function pulsDivColor(d: string): string {
  if (d.includes('SM') || d.includes('slutspel')) return 'hsl(44, 50%, 52%)'
  if (d.includes('Damer')) return 'hsl(320, 30%, 58%)'
  if (d.includes('Elitserien')) return 'hsl(210, 35%, 55%)'
  if (d.includes('Allsvenskan')) return 'hsl(130, 22%, 50%)'
  return 'hsl(35, 12%, 52%)'
}

export function pulsStreamStyle(url: string) {
  const u = url.toLowerCase()
  if (u.includes('youtube') || u.includes('youtu.be'))
    return {
      label: '▶ YouTube',
      color: '#ff4040',
      bg: 'rgba(255,60,60,0.12)',
      border: 'rgba(255,60,60,0.3)',
    }
  if (u.includes('svtplay') || u.includes('svt.se'))
    return {
      label: '▶ SVT Play',
      color: '#5ab0e8',
      bg: 'rgba(90,176,232,0.12)',
      border: 'rgba(90,176,232,0.3)',
    }
  if (u.includes('svenskbowling') || u.includes('sb.tv'))
    return {
      label: '▶ Svensk Bowling TV',
      color: '#f5c200',
      bg: 'rgba(245,194,0,0.12)',
      border: 'rgba(245,194,0,0.3)',
    }
  return {
    label: '▶ Livestream',
    color: '#e05555',
    bg: 'rgba(224,85,85,0.12)',
    border: 'rgba(224,85,85,0.3)',
  }
}
