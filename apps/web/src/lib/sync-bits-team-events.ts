// Server-only. The Auto-Story Engine on the BITS model — generates team_events
// (keyed by bits_team_id) from bits_matches + bits_match_scores. Idempotent;
// inserts at most MAX_INSERT_PER_SYNC per call. Phase 1: match_result + win_streak.
import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceSupabase } from '@/lib/supabase-server'
import { createPublicSupabase } from '@/lib/supabase-public'
import { SEASON, TEAM_EVENT } from '@/lib/constants'
import type { MatchResultPayload, StreakPayload, PersonalBestPayload, PlayerMilestonePayload, FormRisingPayload } from '@/lib/types'

type RawBitsMatch = {
  bits_match_id: number; match_date: string
  home_result: number | null; away_result: number | null
  home_bits_team_id: number | null; away_bits_team_id: number | null
  home_team_name: string; away_team_name: string; division_name: string | null
}
type RawScore = { bits_match_id: number; player_name: string; score: number; is_home_team: boolean | null }

export async function syncBitsTeamEvents(bitsTeamId: number, seasonFloor: string = SEASON.CURRENT): Promise<number> {
  const pub = createPublicSupabase()
  const svc = createServiceSupabase() as unknown as SupabaseClient // bits_team_id isn't in generated types

  const { data: matchesRaw } = await pub
    .from('bits_matches')
    .select('bits_match_id, match_date, home_result, away_result, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, division_name')
    .or(`home_bits_team_id.eq.${bitsTeamId},away_bits_team_id.eq.${bitsTeamId}`)
    .eq('is_finished', true)
    .gte('match_date', seasonFloor)
    .order('match_date', { ascending: true })
  const matches = (matchesRaw ?? []) as RawBitsMatch[]
  if (!matches.length) return 0

  // Idempotency: what's already stored for this team. Per-player events dedupe on
  // the player name (pulled from payload) since a match yields several of them.
  const { data: existing } = await svc
    .from('team_events').select('event_type, match_id, event_date, payload').eq('bits_team_id', bitsTeamId)
  const existingSet = new Set(((existing ?? []) as { event_type: string; match_id: string | null; event_date: string; payload: Record<string, unknown> | null }[])
    .map((e) => eventKey(e.event_type, e.match_id, e.event_date, (e.payload?.player_name as string | undefined) ?? '')))

  // Per-player serie scores for the top-scorer line.
  const { data: scoresRaw } = await pub
    .from('bits_match_scores').select('bits_match_id, player_name, score, is_home_team')
    .in('bits_match_id', matches.map((m) => m.bits_match_id))
  const scoresByMatch = new Map<number, RawScore[]>()
  for (const s of (scoresRaw ?? []) as RawScore[]) {
    const arr = scoresByMatch.get(s.bits_match_id) ?? []
    arr.push(s); scoresByMatch.set(s.bits_match_id, arr)
  }

  const inserts: Record<string, unknown>[] = []
  const MAX = TEAM_EVENT.MAX_INSERT_PER_SYNC

  // ── match_result ─────────────────────────────────────────────────────────
  for (const m of matches) {
    const date = m.match_date.slice(0, 10)
    if (existingSet.has(eventKey('match_result', String(m.bits_match_id), date))) continue
    const isHome = m.home_bits_team_id === bitsTeamId
    const myScore = isHome ? m.home_result : m.away_result
    const oppScore = isHome ? m.away_result : m.home_result
    if (myScore == null || oppScore == null) continue
    const oppName = isHome ? m.away_team_name : m.home_team_name
    const result = myScore > oppScore ? 'W' : myScore < oppScore ? 'L' : 'D'
    const top = bestScorer((scoresByMatch.get(m.bits_match_id) ?? []).filter((s) => !!s.is_home_team === isHome))

    const payload: MatchResultPayload = {
      opponent_id: '', opponent_name: oppName, my_score: myScore, opp_score: oppScore,
      is_home: isHome, division: m.division_name ?? '', result,
      top_scorer: top ? { player_id: '', name: top.name, high_game: top.high } : null,
    }
    inserts.push({
      team_id: null, bits_team_id: bitsTeamId, event_type: 'match_result', event_date: date,
      match_id: String(m.bits_match_id), featured_player_id: null,
      title: matchResultTitle(result, oppName, myScore, oppScore, isHome),
      body: matchResultBody(result, myScore, oppScore, isHome, top),
      payload, captain_note: null, is_pinned: false, is_hidden: false,
    })
    existingSet.add(eventKey('match_result', String(m.bits_match_id), date))
    if (inserts.length >= MAX) { await flush(svc, inserts); return inserts.length }
  }

  // ── win_streak (by board-point outcomes) ─────────────────────────────────
  let streak = 0
  for (const m of matches) {
    const isHome = m.home_bits_team_id === bitsTeamId
    const my = isHome ? m.home_result : m.away_result
    const opp = isHome ? m.away_result : m.home_result
    const out = outcomeOf(my, opp)
    if (out === null) continue
    if (out === 'W') {
      streak++
      const date = m.match_date.slice(0, 10)
      if ((TEAM_EVENT.WIN_STREAK_MILESTONES as readonly number[]).includes(streak)
          && !existingSet.has(eventKey('win_streak', String(m.bits_match_id), date))) {
        const payload: StreakPayload = { streak_length: streak, previous_best: streak, is_season_best: true }
        inserts.push({
          team_id: null, bits_team_id: bitsTeamId, event_type: 'win_streak', event_date: date,
          match_id: String(m.bits_match_id), featured_player_id: null,
          title: winStreakTitle(streak),
          body: streak >= 5 ? 'Laget hittar sin bästa form. Varje match bygger vidare på den förra.' : 'Momentum är på vår sida — håller vi det rullande?',
          payload, captain_note: null, is_pinned: false, is_hidden: false,
        })
        existingSet.add(eventKey('win_streak', String(m.bits_match_id), date))
        if (inserts.length >= MAX) break
      }
    } else {
      streak = 0
    }
  }

  // Per-match, per-player games on our side (matches are date-ordered above).
  const perMatch = matches.map((m) => {
    const isHome = m.home_bits_team_id === bitsTeamId
    const byPlayer = new Map<string, number[]>()
    for (const s of (scoresByMatch.get(m.bits_match_id) ?? []).filter((x) => !!x.is_home_team === isHome)) {
      const arr = byPlayer.get(s.player_name) ?? []; arr.push(s.score); byPlayer.set(s.player_name, arr)
    }
    return { match: m, byPlayer }
  })

  // ── personal_best (a new season-high game) ───────────────────────────────
  if (inserts.length < MAX) {
    const best = new Map<string, number>()
    for (const { match, byPlayer } of perMatch) {
      const date = match.match_date.slice(0, 10)
      for (const [name, games] of byPlayer) {
        const high = Math.max(...games.filter((g) => g > 0), 0)
        if (!high) continue
        const prev = best.get(name) ?? 0
        if (high > prev) {
          if (prev > 0 && !existingSet.has(eventKey('personal_best', String(match.bits_match_id), date, name))) {
            const payload: PersonalBestPayload = { player_id: '', player_name: name, new_best: high, previous_best: prev, match_id: String(match.bits_match_id) }
            inserts.push({
              team_id: null, bits_team_id: bitsTeamId, event_type: 'personal_best', event_date: date,
              match_id: String(match.bits_match_id), featured_player_id: null,
              title: personalBestTitle(name, high, high - prev),
              body: `${high - prev} pins bättre än tidigare bästa på ${prev}. Kvällen tillhörde ${name}.`,
              payload, captain_note: null, is_pinned: false, is_hidden: false,
            })
            existingSet.add(eventKey('personal_best', String(match.bits_match_id), date, name))
            if (inserts.length >= MAX) break
          }
          best.set(name, high)
        }
      }
      if (inserts.length >= MAX) break
    }
  }

  // ── player_milestone (10 / 25 / 50 / 100 matches for the team) ───────────
  if (inserts.length < MAX) {
    const count = new Map<string, number>()
    for (const { match, byPlayer } of perMatch) {
      const date = match.match_date.slice(0, 10)
      for (const name of byPlayer.keys()) {
        const n = (count.get(name) ?? 0) + 1
        count.set(name, n)
        if ((TEAM_EVENT.PLAYER_MATCH_MILESTONES as readonly number[]).includes(n)
            && !existingSet.has(eventKey('player_milestone', String(match.bits_match_id), date, name))) {
          const ord = milestoneOrdinal(n)
          const payload: PlayerMilestonePayload = { player_id: '', player_name: name, milestone: n as 10 | 25 | 50 | 100, total_matches: n }
          inserts.push({
            team_id: null, bits_team_id: bitsTeamId, event_type: 'player_milestone', event_date: date,
            match_id: String(match.bits_match_id), featured_player_id: null,
            title: `${name}s ${ord} match`, body: `Spelade sin ${ord} tävlingsmatch för laget.`,
            payload, captain_note: null, is_pinned: false, is_hidden: false,
          })
          existingSet.add(eventKey('player_milestone', String(match.bits_match_id), date, name))
          if (inserts.length >= MAX) break
        }
      }
      if (inserts.length >= MAX) break
    }
  }

  // ── form_rising (recent 3-match avg vs season avg) ───────────────────────
  if (inserts.length < MAX) {
    const avgsByPlayer = new Map<string, number[]>()
    for (const { byPlayer } of perMatch) {
      for (const [name, games] of byPlayer) {
        const avg = calcMatchAvg(games)
        if (avg === null) continue
        const a = avgsByPlayer.get(name) ?? []; a.push(avg); avgsByPlayer.set(name, a)
      }
    }
    const lastDate = matches[matches.length - 1].match_date.slice(0, 10)
    for (const [name, avgs] of avgsByPlayer) {
      if (avgs.length < 4) continue
      const seasonAvg = Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length)
      const recent = avgs.slice(-3)
      const recentAvg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
      const delta = recentAvg - seasonAvg
      if (delta >= TEAM_EVENT.FORM_RISING_DELTA && !existingSet.has(eventKey('form_rising', null, lastDate, name))) {
        const payload: FormRisingPayload = { player_id: '', player_name: name, delta, recent_avg: recentAvg, season_avg: seasonAvg, match_avgs: avgs.slice(-8) }
        inserts.push({
          team_id: null, bits_team_id: bitsTeamId, event_type: 'form_rising', event_date: lastDate,
          match_id: null, featured_player_id: null,
          title: formRisingTitle(name, delta, recentAvg),
          body: `Snittade ${recentAvg} de senaste tre matcherna — ${delta} pins över sitt säsongssnitt på ${seasonAvg}.`,
          payload, captain_note: null, is_pinned: false, is_hidden: false,
        })
        existingSet.add(eventKey('form_rising', null, lastDate, name))
        if (inserts.length >= MAX) break
      }
    }
  }

  await flush(svc, inserts)
  return inserts.length
}

// ── helpers (ported from the legacy engine, adapted to BITS) ──────────────────
function eventKey(type: string, matchId: string | null, date: string, player = '') { return `${type}|${matchId ?? ''}|${date}|${player}` }

async function flush(svc: SupabaseClient, inserts: Record<string, unknown>[]) {
  if (inserts.length) await svc.from('team_events').insert(inserts)
}

function outcomeOf(my: number | null, opp: number | null): 'W' | 'D' | 'L' | null {
  if (my === null || opp === null) return null
  return my > opp ? 'W' : my < opp ? 'L' : 'D'
}

function bestScorer(rows: RawScore[]): { name: string; high: number } | null {
  const byPlayer = new Map<string, number>()
  for (const r of rows) byPlayer.set(r.player_name, Math.max(byPlayer.get(r.player_name) ?? 0, r.score))
  let best: { name: string; high: number } | null = null
  for (const [name, high] of byPlayer) if (high > (best?.high ?? 0)) best = { name, high }
  return best
}

function winStreakTitle(n: number): string {
  if (n >= 10) return `${n} raka — en historisk svit`
  if (n >= 7) return 'Sju matcher utan förlust'
  if (n === 5) return 'Fem i rad — laget rullar'
  if (n === 3) return 'Tre matcher, tre segrar'
  return `${n} raka utan förlust`
}

function matchResultTitle(result: 'W' | 'D' | 'L', opp: string, my: number, opps: number, home: boolean): string {
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

function matchResultBody(result: 'W' | 'D' | 'L', my: number, opps: number, home: boolean, top: { name: string; high: number } | null): string {
  const venue = home ? 'hemma' : 'borta'
  const hero = top ? `${top.name} toppade med ${top.high} pins.` : null
  if (result === 'W') { const base = `Tre poäng ${venue} med ${my}–${opps}.`; return hero ? `${base} ${hero}` : base }
  if (result === 'L') return hero ? `${hero} Räckte inte — föll ${my}–${opps} ${venue}.` : `Svårt ${venue}möte — föll ${my}–${opps}.`
  return hero ? `Oavgjort ${my}–${opps} ${venue}. ${hero}` : `Delade poängen ${my}–${opps} ${venue}.`
}

function calcMatchAvg(games: number[]): number | null {
  const valid = (games ?? []).filter((g) => g > 0)
  return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null
}

function milestoneOrdinal(n: number): string { return `${n}:e` }

function personalBestTitle(name: string, newBest: number, delta: number): string {
  if (delta >= 20) return `${name} slår rekord med ${delta} pins`
  if (delta >= 10) return `${newBest} pins — ${name} skriver om rekordboken`
  return `${newBest} pins — ${name} kniper eget rekord`
}

function formRisingTitle(name: string, delta: number, _recentAvg: number): string {
  if (delta >= 15) return `${name} i karriärbästa form just nu`
  if (delta >= 10) return `${name} klättrar — ${delta} pins över snitt`
  return `Tre raka över snitt för ${name}`
}
