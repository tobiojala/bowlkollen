// Pure helpers for the BITS Auto-Story Engine — no I/O, so they're unit-tested
// in __tests__/sync-bits-team-events.test.ts. Split out of sync-bits-team-events.ts
// to keep that file under the 300-line limit (AGENTS.md).
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
  // Tabellpoäng per Blåboken — same rule as computeStandings (@bowlkollen/core):
  // win = 2, draw = 1, loss = 0. (Was wrongly "Tre poäng", diverging from the table.)
  if (result === 'W') { const base = `Två poäng ${venue} med ${my}–${opps}.`; return hero ? `${base} ${hero}` : base }
  if (result === 'L') return hero ? `${hero} Räckte inte — föll ${my}–${opps} ${venue}.` : `Svårt ${venue}möte — föll ${my}–${opps}.`
  return hero ? `Oavgjort ${my}–${opps} ${venue}. ${hero}` : `Delade poängen ${my}–${opps} ${venue}.`
}

// Career personbästa — a new highest single game vs the tracked all-time record in
// player_records (backfilled from all our per-game history, maintained forward). Only
// fires when the stored record is actually beaten, so the claim is provable.
export function personalBestTitle(name: string, newBest: number, delta: number): string {
  if (delta >= 20) return `${newBest} pins — ${name} krossar sitt personbästa`
  if (delta >= 10) return `${newBest} pins — nytt personbästa för ${name}`
  return `${newBest} pins — ${name} kniper nytt personbästa`
}

// Career best serie (a match total) — the same idea for a whole-match record.
export function serieBestTitle(name: string, newBest: number, delta: number): string {
  if (delta >= 40) return `${newBest} — ${name} krossar sin bästa serie`
  return `${newBest} — ${name}s bästa serie hittills`
}

// ── Personal records (career best game + best serie) ──────────────────────────
export type PlayerRecord = { bestGame: number; bestSerie: number }
export type RecordSlot = { value: number; date: string; matchId: number }
export type RecordUpdate = { game?: RecordSlot; serie?: RecordSlot }
export type RecordMatch = { match: { bits_match_id: number; match_date: string }; byPlayer: Map<string, number[]> }

// Pure: over this season's matches (chronological), find each game/serie that BEATS the
// player's stored career record, emitting a personbästa story and the record bump. The
// baseline (`records`, from player_records) already includes everything we've synced, so
// only genuinely new peaks fire — never a first-sync flood. A player with no record yet
// (bestGame 0) sets their baseline silently. Distinct 'game'/'serie' event keys so both
// can fire the same night. `updates` carries the new maxes to persist to player_records.
export function personalRecordInserts(
  bitsTeamId: number, perMatch: RecordMatch[], nameToLic: Map<string, string>,
  records: Map<string, PlayerRecord>, seen: Set<string>, remaining: number,
): { events: Record<string, unknown>[]; updates: Map<string, RecordUpdate> } {
  const events: Record<string, unknown>[] = []
  const updates = new Map<string, RecordUpdate>()
  const work = new Map<string, PlayerRecord>()
  const row = (date: string, matchId: number, name: string, kind: 'game' | 'serie', nv: number, pv: number) => ({
    team_id: null, bits_team_id: bitsTeamId, event_type: 'personal_best', event_date: date,
    match_id: String(matchId), featured_player_id: null,
    title: kind === 'serie' ? serieBestTitle(name, nv, nv - pv) : personalBestTitle(name, nv, nv - pv),
    body: kind === 'serie'
      ? `${nv - pv} pinnfall bättre än förra bästa serien på ${pv}. Nytt rekord för ${name}.`
      : `${nv - pv} pins bättre än förra personbästat på ${pv}. Nytt rekord för ${name}.`,
    payload: { player_id: '', player_name: name, new_best: nv, previous_best: pv, match_id: String(matchId), kind },
    captain_note: null, is_pinned: false, is_hidden: false,
  })
  for (const { match, byPlayer } of perMatch) {
    const date = match.match_date.slice(0, 10)
    for (const [name, games] of byPlayer) {
      const raw = nameToLic.get(name)
      if (!raw) continue
      const lic = raw.toUpperCase()   // player_records is keyed by upper(lic_nbr)
      const valid = games.filter((g) => g > 0)
      if (!valid.length) continue
      const high = Math.max(...valid)
      const serie = valid.reduce((a, b) => a + b, 0)
      const rec = work.get(lic) ?? records.get(lic) ?? { bestGame: 0, bestSerie: 0 }
      let g = rec.bestGame, s = rec.bestSerie
      if (high > rec.bestGame) {
        if (rec.bestGame > 0 && events.length < remaining && !seen.has(eventKey('personal_best', String(match.bits_match_id), date, `${name}#game`))) {
          events.push(row(date, match.bits_match_id, name, 'game', high, rec.bestGame))
          seen.add(eventKey('personal_best', String(match.bits_match_id), date, `${name}#game`))
        }
        g = high; setUpdate(updates, lic, 'game', { value: high, date, matchId: match.bits_match_id })
      }
      if (serie > rec.bestSerie) {
        if (rec.bestSerie > 0 && events.length < remaining && !seen.has(eventKey('personal_best', String(match.bits_match_id), date, `${name}#serie`))) {
          events.push(row(date, match.bits_match_id, name, 'serie', serie, rec.bestSerie))
          seen.add(eventKey('personal_best', String(match.bits_match_id), date, `${name}#serie`))
        }
        s = serie; setUpdate(updates, lic, 'serie', { value: serie, date, matchId: match.bits_match_id })
      }
      work.set(lic, { bestGame: g, bestSerie: s })
    }
  }
  return { events, updates }
}

function setUpdate(updates: Map<string, RecordUpdate>, lic: string, kind: 'game' | 'serie', slot: RecordSlot) {
  const u = updates.get(lic) ?? {}
  u[kind] = slot
  updates.set(lic, u)
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

// revenge_win inserts. Pure: finds wins that avenge a prior loss to the same
// opponent. Returns up to `remaining` rows and records their keys in `seen`
// (idempotency).
//
// giant_killer was REMOVED here: it ranked teams from a fake mini-table built out
// of only THIS team's own matches (not the real division table), so it made false
// "Slog serieledaren" / "N:an i tabellen" / "N platser högre upp" claims that
// disagreed with the standings. Re-add it only when ranked against the authoritative
// computeStandings over the whole division+season (see feed-standings.ts for the
// correct pattern) — never against a subset.
export function emotionalWinInserts(
  matches: EmotionalMatch[], bitsTeamId: number, seen: Set<string>, remaining: number,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  if (remaining <= 0) return out

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
  }
  return out
}
