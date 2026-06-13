import type { Match, HonorEntry, TableRow } from './types'
import { countdown, tensionInsight, tensionScore } from './helpers'
import { shortName } from '@/lib/utils'

// A "Moment" is one headline-worthy story derived from the raw data.
// The homepage leads with the highest-priority moment instead of a stat table.
export type MomentKind = 'live' | 'countdown' | 'streak' | 'record' | 'stakes'

export type Moment = {
  id: string
  kind: MomentKind
  priority: number       // higher = more emotionally relevant right now
  eyebrow: string        // small uppercase label, e.g. "OM 2D 4H" / "LIVE NU"
  headline: string       // the big bold line
  sub?: string           // supporting context
  href: string
  hue: number            // accent hue (0–360) for the card gradient
  emoji?: string
  match?: Match          // present → render live score / countdown treatment
  pulse?: boolean        // live pulsing indicator
}

type BuildOpts = {
  live: Match[]
  upcoming: Match[]
  recent: Match[]
  honor: HonorEntry[]
  tables: Record<string, TableRow[]>
  followedIds: Set<string>
  now: number
}

// Two teams meeting that are both top-4 in their division = a marquee clash.
function isTopMeeting(m: Match, tables: Record<string, TableRow[]>): boolean {
  const t = tables[m.division]
  if (!t) return false
  const h = t.find(r => r.teamId === m.home?.id)?.rank
  const a = t.find(r => r.teamId === m.away?.id)?.rank
  return !!h && !!a && h <= 4 && a <= 4
}

export function buildMoments(opts: BuildOpts): Moment[] {
  const { live, upcoming, recent, honor, tables, followedIds, now } = opts
  const out: Moment[] = []
  const follows = (id?: string) => !!id && followedIds.has(id)
  const mineMatch = (m: Match) => follows(m.home?.id) || follows(m.away?.id)

  // 1 — LIVE. A followed team playing now trumps everything; otherwise the
  //     tensest live match becomes a "you have to watch this" story.
  for (const m of live) {
    const tens = tensionScore(m)
    const mine = mineMatch(m)
    out.push({
      id: 'live-' + m.id,
      kind: 'live',
      priority: mine ? 100 : 62 + tens * 22,
      eyebrow: mine ? 'DITT LAG SPELAR NU' : 'LIVE',
      headline: `${shortName(m.home.name)} – ${shortName(m.away.name)}`,
      sub: tensionInsight(m) || m.division,
      href: '/matches/' + m.id,
      hue: 6,
      pulse: true,
      match: m,
    })
  }

  // 2 — COUNTDOWN. The next match that matters to the user, or the next
  //     notable fixture for everyone else. Anticipation is the daily hook.
  const upSorted = [...upcoming].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  const nextNotable =
    upSorted.find(m => /SM|slutspel|final/i.test(m.division)) ?? upSorted[0]
  const cd = upSorted.find(mineMatch) ?? nextNotable
  if (cd) {
    const mine = mineMatch(cd)
    const top = isTopMeeting(cd, tables)
    const big = /SM|slutspel|final/i.test(cd.division)
    const cdLabel = countdown(cd.date, now)
    out.push({
      id: 'cd-' + cd.id,
      kind: 'countdown',
      priority: mine ? 92 : top ? 58 : big ? 48 : 36,
      eyebrow: cdLabel ? `OM ${cdLabel}` : 'IDAG',
      headline: `${shortName(cd.home.name)} ⚔ ${shortName(cd.away.name)}`,
      sub: mine ? 'Din match närmar sig' : top ? 'Toppmöte · ' + cd.division : cd.division,
      href: '/matches/' + cd.id,
      hue: 210,
      match: cd,
    })
  }

  // 3 — STREAK. A team riding a winning run, computed from recent results.
  const byTeam: Record<string, { name: string; rows: { date: string; won: boolean }[] }> = {}
  const push = (id: string, name: string, date: string, won: boolean) => {
    if (!id) return
    ;(byTeam[id] ??= { name, rows: [] }).rows.push({ date, won })
  }
  for (const m of recent) {
    if (m.home_score == null || m.away_score == null) continue
    push(m.home.id, m.home.name, m.date, m.home_score > m.away_score)
    push(m.away.id, m.away.name, m.date, m.away_score > m.home_score)
  }
  let best: { id: string; name: string; n: number } | null = null
  for (const [id, t] of Object.entries(byTeam)) {
    const rows = t.rows.sort((a, b) => b.date.localeCompare(a.date))
    let n = 0
    for (const r of rows) { if (r.won) n++; else break }
    if (n >= 2 && (!best || n > best.n)) best = { id, name: t.name, n }
  }
  if (best) {
    out.push({
      id: 'streak-' + best.id,
      kind: 'streak',
      priority: (follows(best.id) ? 78 : 46) + best.n,
      eyebrow: 'I FORM',
      headline: `${shortName(best.name)} — ${best.n} raka segrar`,
      sub: follows(best.id) ? 'Ditt lag är hetast just nu' : 'Bästa formen i ligan',
      href: '/teams/' + best.id,
      hue: 150,
      emoji: '🔥',
    })
  }

  // 4 — RECORD. The biggest individual game on the board. A 300 is electric.
  const topGame = [...honor].sort((a, b) => b.score - a.score)[0]
  if (topGame) {
    const perfect = topGame.score === 300
    out.push({
      id: `record-${topGame.matchId}-${topGame.score}`,
      kind: 'record',
      priority: perfect ? 86 : 50 + Math.max(0, topGame.score - 250) / 5,
      eyebrow: perfect ? 'PERFECT GAME' : 'DAGENS HÖGSTA',
      headline: perfect
        ? `${topGame.playerName} kastade 300!`
        : `${topGame.playerName} — ${topGame.score}`,
      sub: perfect
        ? 'Tolv strikes i rad — ett perfekt spel'
        : topGame.seriesTotal
          ? `Serie ${topGame.seriesTotal}`
          : 'Dagens bästa game',
      href: '/matches/' + topGame.matchId,
      hue: 280,
      emoji: perfect ? '🎯' : '🎳',
    })
  }

  // 5 — STAKES. Who's on top, as a low-priority always-there fallback so the
  //     hero is never empty when there's any standings data at all.
  const headDiv = tables['Elitserien Herrar'] ?? Object.values(tables)[0]
  if (headDiv && headDiv.length >= 1) {
    const leader = headDiv[0]
    out.push({
      id: 'stakes-leader-' + leader.teamId,
      kind: 'stakes',
      priority: follows(leader.teamId) ? 70 : 30,
      eyebrow: 'I TOPPEN',
      headline: `${shortName(leader.teamName)} leder serien`,
      sub: `${leader.points} poäng efter ${leader.played} matcher`,
      href: '/league',
      hue: 44,
      emoji: '👑',
    })
  }

  return out.sort((a, b) => b.priority - a.priority)
}
