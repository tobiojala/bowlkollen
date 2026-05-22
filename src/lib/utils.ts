export function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

export function teamInitials(n: string) {
  return shortName(n).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

export function teamColor(name: string, isDark: boolean) {
  const hue = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return {
    bg: isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`,
    border: `hsl(${hue},50%,45%)`,
    text: `hsl(${hue},50%,45%)`,
  }
}
