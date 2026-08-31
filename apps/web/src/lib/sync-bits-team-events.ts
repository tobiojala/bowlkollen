// Server-only. The Auto-Story Engine on the BITS model — generates team_events
// (keyed by bits_team_id) from bits_matches + bits_match_scores. Idempotent;
// inserts at most MAX_INSERT_PER_SYNC per call. Phase 1: match_result + win_streak.
import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceSupabase } from '@/lib/supabase-server'
import { createPublicSupabase } from '@/lib/supabase-public'
import { SEASON, TEAM_EVENT } from '@/lib/constants'
import type { MatchResultPayload, StreakPayload, PersonalBestPayload, PlayerMilestonePayload, FormRisingPayload } from '@/lib/types'
import {
  eventKey, outcomeOf, bestScorer, calcMatchAvg, milestoneOrdinal,
  winStreakTitle, matchResultTitle, matchResultBody, personalBestTitle, formRisingTitle,
  emotionalWinInserts,
} from './sync-bits-team-events.helpers'

type RawBitsMatch = {
  bits_match_id: number; match_date: string
  home_result: number | null; away_result: number | null
  home_score: number | null; away_score: number | null
  home_bits_team_id: number | null; away_bits_team_id: number | null
  home_team_name: string; away_team_name: string; division_name: string | null
}
type RawResult = { bits_match_id: number; lic_nbr: string; player_name: string; series: number[] | null; is_home_team: boolean }

export async function syncBitsTeamEvents(bitsTeamId: number, seasonFloor: string = SEASON.CURRENT): Promise<number> {
  const pub = createPublicSupabase()
  const svc = createServiceSupabase() as unknown as SupabaseClient // bits_team_id isn't in generated types

  const { data: matchesRaw } = await pub
    .from('bits_matches')
    .select('bits_match_id, match_date, home_result, away_result, home_score, away_score, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, division_name')
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

  // Per-player exact results (has lic_nbr → resolves to public_id, and the games array).
  const { data: resultsRaw } = await pub
    .from('bits_match_player_results').select('bits_match_id, lic_nbr, player_name, series, is_home_team')
    .in('bits_match_id', matches.map((m) => m.bits_match_id))
  const resultsByMatch = new Map<number, RawResult[]>()
  const nameToLic = new Map<string, string>()
  for (const r of (resultsRaw ?? []) as RawResult[]) {
    const arr = resultsByMatch.get(r.bits_match_id) ?? []
    arr.push(r); resultsByMatch.set(r.bits_match_id, arr)
    nameToLic.set(r.player_name, r.lic_nbr)
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
    const top = bestScorer((resultsByMatch.get(m.bits_match_id) ?? []).filter((r) => !!r.is_home_team === isHome))

    const payload: MatchResultPayload = {
      opponent_id: '', opponent_name: oppName, my_score: myScore, opp_score: oppScore,
      my_pins: isHome ? m.home_score : m.away_score, opp_pins: isHome ? m.away_score : m.home_score,
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
    for (const r of (resultsByMatch.get(m.bits_match_id) ?? []).filter((x) => !!x.is_home_team === isHome)) {
      byPlayer.set(r.player_name, (r.series ?? []).filter((g) => g > 0))
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

  // ── revenge_win + giant_killer (emotional wins) — see helpers ─────────────
  for (const ins of emotionalWinInserts(matches, bitsTeamId, existingSet, MAX - inserts.length)) inserts.push(ins)

  // Resolve player names → public_id (via lic_nbr) so per-player cards deep-link
  // to the profile instead of falling back to the team.
  const lics = [...new Set(nameToLic.values())]
  if (lics.length) {
    const { data: players } = await pub.from('bits_players').select('lic_nbr, public_id').in('lic_nbr', lics)
    const licToPublic = new Map(((players ?? []) as { lic_nbr: string; public_id: string | null }[]).map((p) => [p.lic_nbr, p.public_id]))
    for (const ins of inserts) {
      const pl = ins.payload as { player_name?: string; player_id?: string } | undefined
      if (pl && pl.player_id === '' && pl.player_name) {
        const publicId = licToPublic.get(nameToLic.get(pl.player_name) ?? '')
        if (publicId) pl.player_id = publicId
      }
    }
  }

  await flush(svc, inserts)
  return inserts.length
}

// ── I/O helper (pure helpers live in ./sync-bits-team-events.helpers) ─────────
async function flush(svc: SupabaseClient, inserts: Record<string, unknown>[]) {
  if (!inserts.length) return
  const { error } = await svc.from('team_events').insert(inserts)
  if (error) throw new Error(`team_events insert failed: ${error.message} (${error.code ?? 'no-code'})${error.details ? ' — ' + error.details : ''}`)
}
