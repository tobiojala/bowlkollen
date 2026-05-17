export function divisionShort(division: string | null): string {
  if (!division) return ''
  if (division === 'Elitserien Herrar') return 'Elitserien H'
  if (division === 'Elitserien Damer') return 'Elitserien D'
  if (division === 'SM-slutspel') return 'SM-slutspel'
  return division
}

export function divisionColor(division: string | null, theme: string): string {
  if (division === 'Elitserien Herrar') return '#4a90d9'
  if (division === 'Elitserien Damer') return '#d94a90'
  if (division === 'SM-slutspel') return '#f5c200'
  return theme === 'dark' ? '#6b7a99' : '#6b7a8d'
}

export function divisionBg(division: string | null, theme: string): string {
  if (division === 'Elitserien Herrar') return theme === 'dark' ? 'rgba(74,144,217,0.12)' : 'rgba(74,144,217,0.1)'
  if (division === 'Elitserien Damer') return theme === 'dark' ? 'rgba(217,74,144,0.12)' : 'rgba(217,74,144,0.1)'
  if (division === 'SM-slutspel') return theme === 'dark' ? 'rgba(245,194,0,0.12)' : 'rgba(245,194,0,0.1)'
  return theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
}
