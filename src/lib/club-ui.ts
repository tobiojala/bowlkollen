/** Club page display helpers. */

import type { CSSProperties } from 'react'

export type ClubTeam = {
  id: string
  name: string
  club: string
  city: string | null
  club_slug: string
  team_path: string | null
}

export function clubHeroGradient(dark: boolean): string {
  return dark
    ? 'linear-gradient(135deg, #0d1a2e 0%, #1a2840 100%)'
    : 'linear-gradient(135deg, #e8f0f8 0%, #d0e0f0 100%)'
}

export function clubTeamPathLabel(path: string | null): string {
  if (path === 'herrar') return 'Herrar'
  if (path === 'damer') return 'Damer'
  if (path === 'allsvenskan') return 'Allsvenskan'
  if (path === 'b-laget') return 'B-laget'
  return 'Lag'
}

export function clubTeamBadgeColor(name: string): string {
  if (name.includes(' H A') || name.endsWith(' A')) return '#4a90d9'
  if (name.includes('DA') || name.endsWith(' D')) return '#d94a90'
  if (name.endsWith(' F')) return '#5ba85a'
  return '#6b7a99'
}

export function clubInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function clubHeroBgStyle(dark: boolean): CSSProperties {
  return { background: clubHeroGradient(dark) }
}

export function clubAvatarStyle(accent: string, bg: string, borderWidth = 2.5): CSSProperties {
  return {
    background: bg,
    border: `${borderWidth}px solid ${accent}`,
    color: accent,
  }
}

export function clubBadgeStyle(color: string): CSSProperties {
  return { color, background: `${color}18` }
}
