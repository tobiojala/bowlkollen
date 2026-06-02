export function shortName(n: string) {
  return (n || '').replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
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

// Tier-based accent colour used throughout the app
export function divTierColor(div: string | null): string {
  if (!div) return 'rgba(160,175,200,0.55)'
  if (div.includes('Elitserien')) return '#f5c200'
  if (div.includes('Allsvenskan')) return '#5a82b4'
  if (div.startsWith('Div 1') || div.startsWith('Division 1')) return '#38a088'
  return '#9b6dbd'
}
