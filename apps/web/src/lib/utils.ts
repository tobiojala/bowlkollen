export function shortName(n: string) {
  return (n || '').replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

/**
 * A team's "home" division for the header badge — the league it mainly plays in.
 * Picking the *latest* match's division was wrong: for top teams the last game
 * of the season is the SM-slutspel playoff, so they'd show an SM-slutspel badge
 * instead of Elitserien. The most-frequent division is the real league.
 */
export function primaryDivision(matches: { division: string | null }[]): string | null {
  const counts = new Map<string, number>()
  for (const m of matches) {
    if (m.division) counts.set(m.division, (counts.get(m.division) ?? 0) + 1)
  }
  let best: string | null = null
  let max = 0
  for (const [div, n] of counts) {
    if (n > max) { max = n; best = div }
  }
  return best
}

export function teamInitials(n: string) {
  return shortName(n).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

export function teamColor(name: string, isDark: boolean) {
  const hue = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return {
    bg:     isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`,
    border: `hsl(${hue},50%,45%)`,
    text:   `hsl(${hue},50%,45%)`,
  }
}

export function shortDiv(d: string) {
  return d
    .replace(' Herrar', ' H').replace(' Damer', ' D')
    .replace('Mellanallsvenskan', 'Mellansv.').replace('Allsvenskan', 'Allsv.')
    .replace('Elitserien', 'Elit.').replace('Div 1 ', 'D1 ')
    .replace('Norra ', 'N.').replace('Södra ', 'S.')
    .replace('Götaland', 'Götal.').replace('Norrland', 'Norrl.').replace('Svealand', 'Sveal.')
}

export function dateLabel(dateStr: string) {
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today)     return 'IDAG'
  if (dateStr === yesterday) return 'IGÅR'
  return new Date(dateStr + 'T12:00:00')
    .toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })
    .toUpperCase()
}

export function countdown(dateStr: string, now: number): string | null {
  const ms = Math.max(0, new Date(dateStr).getTime() - now)
  if (ms === 0) return null
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const DAY_COLORS = ['#7a7898', '#4e72a0', '#5a82b4', '#3d9490', '#b88830', '#a06840', '#7060a8']
export function dayDotColor(dateStr: string): string {
  return DAY_COLORS[new Date(dateStr + 'T12:00:00').getDay()]
}

// Tier-based accent colour used throughout the app
export function divTierColor(div: string | null): string {
  if (!div) return 'rgba(160,175,200,0.55)'
  if (div.includes('Elitserien')) return '#f5c200'
  if (div.includes('Allsvenskan')) return '#5a82b4'
  if (div.startsWith('Div 1') || div.startsWith('Division 1')) return '#38a088'
  return '#9b6dbd'
}
