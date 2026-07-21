export type Division = {
  name: string
  short: string
  color: string
  bgDark: string
  bgLight: string
  tier: number
}

export const DIVISIONS: Division[] = [
  // Tier 1 - Elitserien
  { name: 'Elitserien Herrar',           short: 'Elitserien H',     color: '#f5c200', bgDark: 'rgba(245,194,0,0.12)',  bgLight: 'rgba(245,194,0,0.1)',  tier: 1 },
  { name: 'Elitserien Damer',            short: 'Elitserien D',     color: '#f5c200', bgDark: 'rgba(245,194,0,0.12)',  bgLight: 'rgba(245,194,0,0.1)',  tier: 1 },
  { name: 'SM-slutspel Herrar',          short: 'SM Herrar',        color: '#f5c200', bgDark: 'rgba(245,194,0,0.12)',  bgLight: 'rgba(245,194,0,0.1)',  tier: 1 },
  { name: 'SM-slutspel Damer',           short: 'SM Damer',         color: '#f5c200', bgDark: 'rgba(245,194,0,0.12)',  bgLight: 'rgba(245,194,0,0.1)',  tier: 1 },
  // Tier 2 - Allsvenskan
  { name: 'Mellanallsvenskan Herrar',    short: 'Mellanallsv.',     color: '#5ba85a', bgDark: 'rgba(91,168,90,0.12)',  bgLight: 'rgba(91,168,90,0.1)',  tier: 2 },
  { name: 'Nordallsvenskan Herrar',      short: 'Nordallsv.',       color: '#5ba85a', bgDark: 'rgba(91,168,90,0.12)',  bgLight: 'rgba(91,168,90,0.1)',  tier: 2 },
  { name: 'Sydallsvenskan Herrar',       short: 'Sydallsv.',        color: '#5ba85a', bgDark: 'rgba(91,168,90,0.12)',  bgLight: 'rgba(91,168,90,0.1)',  tier: 2 },
  { name: 'Norra Allsvenskan Herrar',    short: 'Norra Allsv.',     color: '#5ba85a', bgDark: 'rgba(91,168,90,0.12)',  bgLight: 'rgba(91,168,90,0.1)',  tier: 2 },
  { name: 'Södra Allsvenskan Herrar',    short: 'Södra Allsv.',     color: '#5ba85a', bgDark: 'rgba(91,168,90,0.12)',  bgLight: 'rgba(91,168,90,0.1)',  tier: 2 },
  // Tier 3 - Division 1
  { name: 'Div 1 Norra Götaland Herrar', short: 'Div 1 N.Götaland', color: '#7a9e5a', bgDark: 'rgba(122,158,90,0.12)', bgLight: 'rgba(122,158,90,0.1)', tier: 3 },
  { name: 'Div 1 Norra Norrland Herrar', short: 'Div 1 N.Norrland', color: '#7a9e5a', bgDark: 'rgba(122,158,90,0.12)', bgLight: 'rgba(122,158,90,0.1)', tier: 3 },
  { name: 'Div 1 Norra Svealand Herrar', short: 'Div 1 N.Svealand', color: '#7a9e5a', bgDark: 'rgba(122,158,90,0.12)', bgLight: 'rgba(122,158,90,0.1)', tier: 3 },
  { name: 'Div 1 Södra Götaland Herrar', short: 'Div 1 S.Götaland', color: '#7a9e5a', bgDark: 'rgba(122,158,90,0.12)', bgLight: 'rgba(122,158,90,0.1)', tier: 3 },
  { name: 'Div 1 Södra Norrland Herrar', short: 'Div 1 S.Norrland', color: '#7a9e5a', bgDark: 'rgba(122,158,90,0.12)', bgLight: 'rgba(122,158,90,0.1)', tier: 3 },
  { name: 'Div 1 Södra Svealand Herrar', short: 'Div 1 S.Svealand', color: '#7a9e5a', bgDark: 'rgba(122,158,90,0.12)', bgLight: 'rgba(122,158,90,0.1)', tier: 3 },
]

export function getDivision(name: string | null): Division | null {
  if (!name) return null
  return DIVISIONS.find(d => d.name === name) || null
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
