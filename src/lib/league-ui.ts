/** League table display helpers (zones, row accents). */

import type { CSSProperties } from 'react'

export type LeagueZone = { maxRank: number; color: string; label: string }

export function leagueZoneColor(rank1: number, zones: LeagueZone[]): string {
  for (const z of zones) {
    if (rank1 <= z.maxRank) return z.color
  }
  return 'transparent'
}

export function leagueShowZoneDivider(rank1: number, zones: LeagueZone[]): boolean {
  for (let i = 1; i < zones.length; i++) {
    if (rank1 === zones[i - 1].maxRank + 1) return true
  }
  return false
}

export function leagueZoneDividerStyle(color: string): CSSProperties {
  return { background: color !== 'transparent' ? color : '#444' }
}

export function leagueRowBorderStyle(color: string): CSSProperties {
  return {
    borderLeftWidth: 3,
    borderLeftStyle: 'solid',
    borderLeftColor: color !== 'transparent' ? color : 'transparent',
  }
}

export function leagueRankStyle(color: string): CSSProperties | undefined {
  return color !== 'transparent' ? { color } : undefined
}

export function leagueLegendDotStyle(color: string): CSSProperties {
  return { background: color }
}
