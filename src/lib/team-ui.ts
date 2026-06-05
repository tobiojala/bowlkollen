/** Team page display helpers (avatars, division badges). */

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
