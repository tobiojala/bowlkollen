/** Team page display helpers (avatars, division badges). */

import type { CSSProperties } from 'react'

export function teamHue(name: string): number {
  return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
}

export function teamColors(name: string, dark: boolean) {
  const hue = teamHue(name)
  return {
    accent: `hsl(${hue},50%,45%)`,
    bg: dark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`,
  }
}

export function teamDivisionColor(d: string | null): string {
  if (!d) return '#6b7a99'
  if (d.includes('Elitserien') && d.includes('Herrar')) return '#4a90d9'
  if (d.includes('Elitserien') && d.includes('Damer')) return '#d94a90'
  if (d.includes('SM')) return '#f5c200'
  if (d.includes('Allsvenskan')) return '#5ba85a'
  return '#8a7a5a'
}

export function formResultColor(result: 'V' | 'F' | 'O'): string {
  if (result === 'V') return '#38a088'
  if (result === 'F') return '#e05555'
  return '#6b7a99'
}

export type SeasonMatchResult = 'win' | 'loss' | 'draw' | 'upcoming'

/** Season timeline win/loss/draw tones (legacy `C.green` for wins). */
export function seasonResultTone(result: SeasonMatchResult) {
  switch (result) {
    case 'win':
      return {
        label: 'V',
        text: 'text-[#3d6090] dark:text-[#5a82b4]',
        border: 'border-[#3d6090] dark:border-[#5a82b4]',
        bg: 'bg-[rgba(160,112,48,0.1)] dark:bg-[rgba(91,130,180,0.15)]',
        badgeBg: 'bg-[#3d6090]/13 dark:bg-[#5a82b4]/13',
      }
    case 'loss':
      return {
        label: 'F',
        text: 'text-[#d63b3b] dark:text-[#e05555]',
        border: 'border-[#d63b3b] dark:border-[#e05555]',
        bg: 'bg-[rgba(192,57,43,0.1)] dark:bg-[rgba(224,85,85,0.15)]',
        badgeBg: 'bg-[#d63b3b]/13 dark:bg-[#e05555]/13',
      }
    case 'draw':
      return {
        label: 'O',
        text: 'text-dark-muted',
        border: 'border-dark-muted/50',
        bg: 'bg-[rgba(107,122,141,0.1)] dark:bg-[rgba(107,122,153,0.15)]',
        badgeBg: 'bg-dark-muted/10',
      }
    default:
      return {
        label: '·',
        text: 'text-dark-muted',
        border: 'border-light-border dark:border-dark-border',
        bg: 'bg-light-card dark:bg-dark-card',
        badgeBg: 'bg-light-card dark:bg-dark-card',
      }
  }
}

export function teamAvatarStyle(
  accent: string,
  bg: string,
  borderWidth = 1.5,
): CSSProperties {
  return {
    background: bg,
    border: `${borderWidth}px solid ${accent}`,
    color: accent,
  }
}

/** Nav search / list rows — HSL badge from display name. */
export function hslNameBadgeStyle(name: string, dark = true): CSSProperties {
  const { accent, bg } = teamColors(name, dark)
  return teamAvatarStyle(accent, bg)
}

export function divisionChipStyle(color: string, alpha = '22'): CSSProperties {
  return { color, background: `${color}${alpha}` }
}

/** Teams/clubs list division badge (border + light fill). */
export function divisionBadgeStyle(color: string): CSSProperties {
  return {
    color,
    background: `${color}1a`,
    border: `1px solid ${color}44`,
  }
}

export function divisionAccentBarStyle(color: string): CSSProperties {
  return { background: color }
}

export function divisionTextOptionalStyle(color?: string): CSSProperties | undefined {
  return color ? { color } : undefined
}

export function divisionFillChipStyle(color: string, alpha = '20'): CSSProperties {
  return { color, background: `${color}${alpha}` }
}

export function teamAvatarBorderStyle(accent: string): CSSProperties {
  return { borderColor: accent }
}

export function formResultBadgeStyle(color: string): CSSProperties {
  return {
    background: `${color}22`,
    border: `1.5px solid ${color}`,
    color,
  }
}

export function teamLogoBoxStyle(opts: {
  hasLogo: boolean
  dark: boolean
  accent: string
  bg: string
}): CSSProperties {
  const { hasLogo, dark, accent, bg } = opts
  if (hasLogo) {
    return {
      background: dark ? 'rgba(255,255,255,0.07)' : '#fff',
      border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.10)',
      color: accent,
    }
  }
  return {
    background: bg,
    border: `2.5px solid ${accent}`,
    color: accent,
  }
}
