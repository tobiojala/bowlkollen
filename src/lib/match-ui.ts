/** Shared match display helpers (home hero, puls, etc.) */

import type { CSSProperties } from 'react'

export type MatchLike = {
  id: string
  date: string
  status?: string
  division: string
  home_score: number | null
  away_score: number | null
  home: { id: string; name: string }
  away: { id: string; name: string }
  streams?: { url: string }[]
  gameNumber?: number
  totalGames?: number
}

/** Full division name badge color (match / team detail pages). */
export function matchDivisionColor(d: string | null): string {
  if (!d) return '#6b7a99'
  if (d.includes('SM') || d.includes('slutspel')) return '#f5c200'
  if (d.includes('Damer')) return '#d94a90'
  if (d.includes('Elitserien')) return '#4a90d9'
  if (d.includes('Allsvenskan')) return '#5ba85a'
  return '#8a7a5a'
}

export function divisionAccentColor(d: string): string {
  if (d.includes('Elit')) return '#f5c200'
  if (d.includes('Allsv')) return '#5a82b4'
  if (d.includes('Div 1') || d.includes('Division 1')) return '#38a088'
  if (d.includes('Div 2') || d.includes('Division 2')) return '#9b6dbd'
  if (d.includes('SM')) return '#c07fff'
  return 'hsl(35, 12%, 52%)'
}

export function formResultDotClass(result: 'W' | 'L' | 'D'): string {
  if (result === 'W') return 'bg-[#5a82b4]'
  if (result === 'L') return 'bg-red'
  return 'bg-dark-muted'
}

export function streamPillStyle(ss: {
  color: string
  bg: string
  border: string
}): import('react').CSSProperties {
  return {
    color: ss.color,
    background: ss.bg,
    borderColor: ss.border,
  }
}

export function streamDotStyle(color: string): import('react').CSSProperties {
  return { background: color }
}

export function streamStyle(url: string): { label: string; color: string; bg: string; border: string } {
  const u = url.toLowerCase()
  if (u.includes('youtube') || u.includes('youtu.be')) {
    return { label: '▶ YouTube', color: '#ff4040', bg: 'rgba(255,60,60,0.12)', border: 'rgba(255,60,60,0.3)' }
  }
  if (u.includes('svtplay') || u.includes('svt.se')) {
    return { label: '▶ SVT Play', color: '#5ab0e8', bg: 'rgba(90,176,232,0.12)', border: 'rgba(90,176,232,0.3)' }
  }
  if (u.includes('svenskbowling') || u.includes('sb.tv')) {
    return { label: '▶ Svensk Bowling TV', color: '#f5c200', bg: 'rgba(245,194,0,0.12)', border: 'rgba(245,194,0,0.3)' }
  }
  return { label: '▶ Livestream', color: '#e05555', bg: 'rgba(224,85,85,0.12)', border: 'rgba(224,85,85,0.3)' }
}

export function tensionScore(m: MatchLike): number {
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

export function tensionInsight(m: MatchLike): string {
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
  return 'var(--color-dark-muted, #6b7a99)'
}

export function divisionDotStyle(color: string): CSSProperties {
  return { background: color }
}

export function divisionTextStyle(color: string): CSSProperties {
  return { color }
}
