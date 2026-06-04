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
