import type { Match, TableRow, StandingsMatch } from './types'

export function divColor(d: string) {
  if (d.includes('SM') || d.includes('slutspel')) return 'hsl(44, 50%, 52%)'
  if (d.includes('Damer'))       return 'hsl(320, 30%, 58%)'
  if (d.includes('Elitserien'))  return 'hsl(210, 35%, 55%)'
  if (d.includes('Allsvenskan')) return 'hsl(130, 22%, 50%)'
  return 'hsl(35, 12%, 52%)'
}

export function shortDiv(d: string) {
  return d.replace(' Herrar', ' H').replace(' Damer', ' D')
    .replace('Mellanallsvenskan', 'Mellansv.').replace('Allsvenskan', 'Allsv.')
    .replace('Elitserien', 'Elit.').replace('Div 1 ', 'D1 ')
    .replace('Norra ', 'N.').replace('Södra ', 'S.')
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

export function countdown(dateStr: string, now: number) {
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

export function group(ms: Match[]) {
  const byDate: Record<string, Match[]> = {}
  ms.forEach(m => {
    const d = m.date.slice(0, 10)
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(m)
  })
  return byDate
}

export const DAY_COLORS = ['#7a7898', '#4e72a0', '#5a82b4', '#3d9490', '#b88830', '#a06840', '#7060a8']
export const dayDotColor = (dateStr: string) => DAY_COLORS[new Date(dateStr + 'T12:00:00').getDay()]

export function tensionScore(m: Match): number {
  if (m.home_score === null) return 0
  const h = m.home_score, a = m.away_score!
  const diff  = Math.abs(h - a)
  const total = h + a
  if (total === 0) return 0
  const closeness = 1 - diff / Math.max(total, 1)
  const progress  = Math.min((m.gameNumber ?? 1) / (m.totalGames ?? 4), 1)
  return closeness * (0.6 + 0.4 * progress)
}

export function tensionInsight(m: Match): string {
  if (m.home_score === null) return ''
  const h = m.home_score, a = m.away_score!
  const diff      = Math.abs(h - a)
  const gn        = m.gameNumber ?? 1
  const tg        = m.totalGames ?? 4
  const remaining = tg - gn
  const isTied    = h === a
  if (isTied && remaining <= 0) return 'Oavgjort · Slutspelet avgör'
  if (isTied && remaining === 1) return 'Kvitterat · Avgörande spelet'
  if (isTied) return `Kvitterat · Spel ${gn} av ${tg}`
  if (remaining <= 0) return `${diff} poäng isär · Slutspelet`
  if (remaining === 1 && diff <= 2) return `${diff} poäng · Avgörande spelet!`
  if (remaining === 1) return `${diff} poäng · Sista spelet`
  return `${diff} poäng isär · Spel ${gn} av ${tg}`
}

export function tensionColor(score: number, muted: string): string {
  if (score > 0.85) return '#f5c200'
  if (score > 0.6)  return '#38a088'
  return muted
}

export function streamStyle(url: string): { label: string; color: string; bg: string; border: string } {
  const u = url.toLowerCase()
  if (u.includes('youtube') || u.includes('youtu.be'))
    return { label: '▶ YouTube', color: '#ff4040', bg: 'rgba(255,60,60,0.12)', border: 'rgba(255,60,60,0.3)' }
  if (u.includes('svtplay') || u.includes('svt.se'))
    return { label: '▶ SVT Play', color: '#5ab0e8', bg: 'rgba(90,176,232,0.12)', border: 'rgba(90,176,232,0.3)' }
  if (u.includes('svenskbowling') || u.includes('sb.tv'))
    return { label: '▶ Svensk Bowling TV', color: '#f5c200', bg: 'rgba(245,194,0,0.12)', border: 'rgba(245,194,0,0.3)' }
  return { label: '▶ Livestream', color: '#e05555', bg: 'rgba(224,85,85,0.12)', border: 'rgba(224,85,85,0.3)' }
}

export function calcHomeStandings(matches: StandingsMatch[], division: string): TableRow[] {
  const divMatches = matches.filter(m => m.division === division && m.home_score !== null)
  const table: Record<string, TableRow & { diff: number }> = {}
  divMatches.forEach(m => {
    const hid = m.home_team_id, aid = m.away_team_id
    if (!table[hid]) table[hid] = { rank: 0, teamId: hid, teamName: m.home.name, played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0 }
    if (!table[aid]) table[aid] = { rank: 0, teamId: aid, teamName: m.away.name, played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0 }
    const hs = m.home_score!, as_ = m.away_score!
    table[hid].played++; table[aid].played++
    table[hid].diff += hs - as_; table[aid].diff += as_ - hs
    if (hs > as_)      { table[hid].won++;   table[hid].points += 2; table[aid].lost++ }
    else if (as_ > hs) { table[aid].won++;   table[aid].points += 2; table[hid].lost++ }
    else               { table[hid].drawn++; table[hid].points++;    table[aid].drawn++; table[aid].points++ }
  })
  return Object.values(table)
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.won - a.won)
    .map((s, i) => ({ rank: i + 1, teamId: s.teamId, teamName: s.teamName, played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, points: s.points }))
}
