export type Division = {
  name: string
  short: string
  color: string
  bgDark: string
  bgLight: string
  tier: number
}

export const DIVISIONS: Division[] = [
  { name: 'Elitserien Herrar',   short: 'Elitserien H', color: '#4a90d9', bgDark: 'rgba(74,144,217,0.12)',  bgLight: 'rgba(74,144,217,0.1)',  tier: 1 },
  { name: 'Elitserien Damer',    short: 'Elitserien D', color: '#d94a90', bgDark: 'rgba(217,74,144,0.12)', bgLight: 'rgba(217,74,144,0.1)', tier: 1 },
  { name: 'SM-slutspel Herrar',  short: 'SM Herrar',    color: '#f5c200', bgDark: 'rgba(245,194,0,0.12)',  bgLight: 'rgba(245,194,0,0.1)',  tier: 1 },
  { name: 'SM-slutspel Damer',   short: 'SM Damer',     color: '#f5c200', bgDark: 'rgba(245,194,0,0.12)',  bgLight: 'rgba(245,194,0,0.1)',  tier: 1 },
  { name: 'Division 1 Herrar',   short: 'Div 1 H',      color: '#5ba85a', bgDark: 'rgba(91,168,90,0.12)',  bgLight: 'rgba(91,168,90,0.1)',  tier: 2 },
  { name: 'Division 1 Damer',    short: 'Div 1 D',      color: '#a85ba8', bgDark: 'rgba(168,91,168,0.12)', bgLight: 'rgba(168,91,168,0.1)', tier: 2 },
  { name: 'Division 2 Herrar',   short: 'Div 2 H',      color: '#7a9e5a', bgDark: 'rgba(122,158,90,0.12)', bgLight: 'rgba(122,158,90,0.1)', tier: 3 },
  { name: 'Division 2 Damer',    short: 'Div 2 D',      color: '#9e7a5a', bgDark: 'rgba(158,122,90,0.12)', bgLight: 'rgba(158,122,90,0.1)', tier: 3 },
]

export function getDivision(name: string | null): Division | null {
  if (!name) return null
  return DIVISIONS.find(d => d.name === name || name.includes(d.name) || d.name.includes(name)) || null
}

export function divisionShort(division: string | null): string {
  return getDivision(division)?.short || division || ''
}

export function divisionColor(division: string | null, theme?: string): string {
  return getDivision(division)?.color || (theme === 'dark' ? '#6b7a99' : '#6b7a8d')
}

export function divisionBg(division: string | null, theme: string): string {
  const d = getDivision(division)
  if (!d) return theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  return theme === 'dark' ? d.bgDark : d.bgLight
}
