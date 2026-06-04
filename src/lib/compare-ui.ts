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

export function compareHeroGradient(teamBg: string, dark: boolean): string {
  return dark
    ? `linear-gradient(135deg, ${teamBg} 0%, rgba(11,21,40,0.95) 100%)`
    : `linear-gradient(135deg, ${teamBg} 0%, rgba(235,240,250,0.98) 100%)`
}

export function teamInitials(name: string): string {
  return shortName(name)
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}
