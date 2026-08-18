// Pure helpers for the BITS Auto-Story Engine — no I/O, so they're unit-tested
// in __tests__/sync-bits-team-events.test.ts. Split out of sync-bits-team-events.ts
// to keep that file under the 300-line limit (AGENTS.md).
import { TEAM_EVENT } from '@/lib/constants'

export type SeriesRow = { player_name: string; series: number[] | null }

export function eventKey(type: string, matchId: string | null, date: string, player = '') {
  return `${type}|${matchId ?? ''}|${date}|${player}`
}

export function outcomeOf(my: number | null, opp: number | null): 'W' | 'D' | 'L' | null {
  if (my === null || opp === null) return null
  return my > opp ? 'W' : my < opp ? 'L' : 'D'
}

export function bestScorer(rows: SeriesRow[]): { name: string; high: number } | null {
  let best: { name: string; high: number } | null = null
  for (const r of rows) {
    const high = Math.max(...(r.series ?? []).filter((g) => g > 0), 0)
    if (high > (best?.high ?? 0)) best = { name: r.player_name, high }
  }
  return best
}

export function calcMatchAvg(games: number[]): number | null {
  const valid = (games ?? []).filter((g) => g > 0)
  return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null
}

export function milestoneOrdinal(n: number): string { return `${n}:e` }

export function winStreakTitle(n: number): string {
  if (n >= 10) return `${n} raka — en historisk svit`
  if (n >= 7) return 'Sju matcher utan förlust'
  if (n === 5) return 'Fem i rad — laget rullar'
  if (n === 3) return 'Tre matcher, tre segrar'
  return `${n} raka utan förlust`
}

export function matchResultTitle(result: 'W' | 'D' | 'L', opp: string, my: number, opps: number, home: boolean): string {
  const margin = Math.abs(my - opps)
  if (result === 'W') {
    if (margin >= 4) return home ? `Dominerade hemma mot ${opp}` : `Tog hem det borta mot ${opp}`
    if (margin >= 2) return `Stark insats — ${opp} stoppades`
    return home ? `Höll undan hemma mot ${opp}` : `Kammade hem poängen borta mot ${opp}`
  }
  if (result === 'L') {
    if (margin >= 4) return `${opp} var för starka ikväll`
    if (margin >= 2) return home ? `${opp} vann på vår plan` : `Gick inte vägen borta mot ${opp}`
    return `Millimetern skilde mot ${opp}`
  }
  return `Delade poängen med ${opp}`
}

export function matchResultBody(result: 'W' | 'D' | 'L', my: number, opps: number, home: boolean, top: { name: string; high: number } | null): string {
  const venue = home ? 'hemma' : 'borta'
  const hero = top ? `${top.name} toppade med ${top.high} pins.` : null
  if (result === 'W') { const base = `Tre poäng ${venue} med ${my}–${opps}.`; return hero ? `${base} ${hero}` : base }
  if (result === 'L') return hero ? `${hero} Räckte inte — föll ${my}–${opps} ${venue}.` : `Svårt ${venue}möte — föll ${my}–${opps}.`
  return hero ? `Oavgjort ${my}–${opps} ${venue}. ${hero}` : `Delade poängen ${my}–${opps} ${venue}.`
}

export function personalBestTitle(name: string, newBest: number, delta: number): string {
  if (delta >= 20) return `${name} slår rekord med ${delta} pins`
  if (delta >= 10) return `${newBest} pins — ${name} skriver om rekordboken`
  return `${newBest} pins — ${name} kniper eget rekord`
}

export function formRisingTitle(name: string, delta: number, _recentAvg: number): string {
  if (delta >= 15) return `${name} i karriärbästa form just nu`
  if (delta >= 10) return `${name} klättrar — ${delta} pins över snitt`
  return `Tre raka över snitt för ${name}`
}

export type EmotionalMatch = {
  bits_match_id: number; match_date: string
  home_result: number | null; away_result: number | null
  home_bits_team_id: number | null; away_bits_team_id: number | null
  home_team_name: string; away_team_name: string
}

// revenge_win + giant_killer inserts. Pure: derives rough standings from the
// team's own completed matches, then finds wins that avenge a prior loss or beat
// a much higher-ranked side. Returns up to `remaining` rows and records their
// keys in `seen` (idempotency), exactly as the inline version did.
export function emotionalWinInserts(
  matches: EmotionalMatch[], bitsTeamId: number, seen: Set<string>, remaining: number,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  if (remaining <= 0) return out

  const pts: Record<number, number> = {}
  for (const m of matches) {
    const h = m.home_bits_team_id, a = m.away_bits_team_id
    if (h == null || a == null || m.home_result == null || m.away_result == null) continue
    pts[h] ??= 0; pts[a] ??= 0
    if (m.home_result > m.away_result) pts[h] += 2
    else if (m.home_result < m.away_result) pts[a] += 2
    else { pts[h]++; pts[a]++ }
  }
  const rankOf = (tid: number) => {
    const sorted = Object.entries(pts).sort((x, y) => y[1] - x[1])
    const idx = sorted.findIndex(([id]) => Number(id) === tid)
    return idx === -1 ? 99 : idx + 1
  }

  for (let i = 1; i < matches.length && out.length < remaining; i++) {
    const m = matches[i]
    const isHome = m.home_bits_team_id === bitsTeamId
    const my = isHome ? m.home_result : m.away_result
    const opp = isHome ? m.away_result : m.home_result
    if (my == null || opp == null || my <= opp) continue // wins only
    const oppTeamId = isHome ? m.away_bits_team_id : m.home_bits_team_id
    const oppName = isHome ? m.away_team_name : m.home_team_name
    const date = m.match_date.slice(0, 10)
    if (oppTeamId == null) continue

    // revenge_win — beat an opponent who beat us in our last meeting
    if (!seen.has(eventKey('revenge_win', String(m.bits_match_id), date))) {
      const prev = matches.slice(0, i).reverse().find((p) =>
        (p.home_bits_team_id === bitsTeamId && p.away_bits_team_id === oppTeamId) ||
        (p.away_bits_team_id === bitsTeamId && p.home_bits_team_id === oppTeamId))
      if (prev) {
        const pHome = prev.home_bits_team_id === bitsTeamId
        const pMy = pHome ? prev.home_result : prev.away_result
        const pOpp = pHome ? prev.away_result : prev.home_result
        if (pMy != null && pOpp != null && pMy < pOpp) {
          out.push({
            team_id: null, bits_team_id: bitsTeamId, event_type: 'revenge_win', event_date: date,
            match_id: String(m.bits_match_id), featured_player_id: null,
            title: `Hämnades mot ${oppName}`, body: `Vann efter förlusten mot ${oppName} förra mötet.`,
            payload: { opponent_id: '', opponent_name: oppName, my_score: my, opp_score: opp },
            captain_note: null, is_pinned: false, is_hidden: false,
          })
          seen.add(eventKey('revenge_win', String(m.bits_match_id), date))
        }
      }
    }

    // giant_killer — beat a team ≥ GAP positions above us
    if (out.length < remaining && !seen.has(eventKey('giant_killer', String(m.bits_match_id), date))) {
      const myRank = rankOf(bitsTeamId), oppRank = rankOf(oppTeamId)
      if (oppRank !== 99 && myRank - oppRank >= TEAM_EVENT.GIANT_KILLER_GAP) {
        out.push({
          team_id: null, bits_team_id: bitsTeamId, event_type: 'giant_killer', event_date: date,
          match_id: String(m.bits_match_id), featured_player_id: null,
          title: `Slog ${oppRank === 1 ? 'serieledaren' : `${oppRank}:an i tabellen`}`,
          body: `${my}–${opp} mot ett lag ${myRank - oppRank} platser högre upp.`,
          payload: { opponent_id: '', opponent_name: oppName, my_score: my, opp_score: opp, rank_gap: myRank - oppRank },
          captain_note: null, is_pinned: false, is_hidden: false,
        })
        seen.add(eventKey('giant_killer', String(m.bits_match_id), date))
      }
    }
  }
  return out
}
