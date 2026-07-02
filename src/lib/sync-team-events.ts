// Server-only. Called from team page.tsx on each page load.
// Idempotent — safe to call repeatedly; inserts at most MAX_INSERT_PER_SYNC new events.
import 'server-only'

import { createServiceSupabase } from '@/lib/supabase-server'
import { createPublicSupabase } from '@/lib/supabase-public'
import { SEASON, TEAM_EVENT } from '@/lib/constants'
import type {
  TeamEvent,
  MatchResultPayload,
  StreakPayload,
  PersonalBestPayload,
  PlayerMilestonePayload,
  FormRisingPayload,
  MatchPreviewPayload,
  DivisionClimbedPayload,
  LineupAnnouncedPayload,
  TableRow,
} from '@/lib/types'
import type { TablesInsert } from '@/lib/database.types'

// ── Internal types (queries only, not exported) ───────────────────────────────

type RawMatch = {
  id: string
  date: string
  home_score: number | null
  away_score: number | null
  home_team_id: string
  away_team_id: string
  division: string
  home: { id: string; name: string }
  away: { id: string; name: string }
}

type RawMatchResult = {
  id: string
  player_id: string
  match_id: string
  games: number[]
  player: { id: string; name: string } | null
}

type PendingInsert = Omit<TeamEvent, 'id' | 'created_at' | 'reactions'>

// ── Main entry point ──────────────────────────────────────────────────────────

export async function syncTeamEvents(teamId: string): Promise<void> {
  const pub = createPublicSupabase()
  const svc = createServiceSupabase()

  // 1. Fetch completed team matches this season
  const { data: matches } = await pub
    .from('matches')
    .select('id,date,home_score,away_score,home_team_id,away_team_id,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
    .eq('status', 'completed')
    .gte('date', SEASON.CURRENT)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order('date', { ascending: true })

  if (!matches?.length) return

  // 2. Fetch all player match results for this team this season
  const matchIds = matches.map(m => m.id)
  const { data: rawResults } = await pub
    .from('match_results')
    .select('id,player_id,match_id,games,player:players!player_id(id,name)')
    .in('match_id', matchIds)
    .eq('team_id', teamId)

  if (!rawResults) return

  // Cast once — Supabase returns joined relations as arrays, RawMatch/RawMatchResult expect objects
  const allMatches = matches as unknown as RawMatch[]
  const results    = rawResults as unknown as RawMatchResult[]

  // 3. Fetch existing events to avoid duplicates
  const { data: existing } = await svc
    .from('team_events')
    .select('event_type,match_id,featured_player_id,event_date')
    .eq('team_id', teamId)
    .gte('event_date', SEASON.CURRENT)

  const existingSet = new Set<string>(
    (existing ?? []).map(e =>
      eventKey(e.event_type, e.match_id ?? null, e.featured_player_id ?? null, e.event_date)
    )
  )

  const inserts: PendingInsert[] = []

  // ── match_result events ────────────────────────────────────────────────────
  for (const match of allMatches) {
    const key = eventKey('match_result', match.id, null, match.date.slice(0, 10))
    if (existingSet.has(key)) continue

    const isHome = match.home_team_id === teamId
    const myScore  = isHome ? match.home_score : match.away_score
    const oppScore = isHome ? match.away_score : match.home_score
    const opponent = isHome ? match.away : match.home

    if (myScore === null || oppScore === null) continue

    const result = myScore > oppScore ? 'W' : myScore < oppScore ? 'L' : 'D'

    const matchResults = (results as RawMatchResult[]).filter(r => r.match_id === match.id)
    const topScorer = bestScorer(matchResults)

    const payload: MatchResultPayload = {
      opponent_id:   opponent.id,
      opponent_name: opponent.name,
      my_score:      myScore,
      opp_score:     oppScore,
      is_home:       isHome,
      division:      match.division,
      result,
      top_scorer: topScorer
        ? { player_id: topScorer.player_id, name: topScorer.name, high_game: topScorer.high }
        : null,
    }

    inserts.push({
      team_id:           teamId,
      event_type:        'match_result',
      event_date:        match.date.slice(0, 10),
      match_id:          match.id,
      featured_player_id: topScorer?.player_id ?? null,
      title:             matchResultTitle(result, opponent.name, myScore, oppScore, isHome),
      body:              matchResultBody(result, myScore, oppScore, isHome, topScorer),
      payload,
      captain_note:      null,
      is_pinned:         false,
      is_hidden:         false,
    })
    existingSet.add(key)
    if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) break
  }

  if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) {
    await flush(svc, inserts)
    return
  }

  // ── win_streak events ──────────────────────────────────────────────────────
  const resultsByDate = allMatches
    .map(m => {
      const isHome = m.home_team_id === teamId
      const my  = isHome ? m.home_score : m.away_score
      const opp = isHome ? m.away_score : m.home_score
      return { matchId: m.id, date: m.date.slice(0, 10), result: outcomeOf(my, opp) }
    })
    .filter(r => r.result !== null) as { matchId: string; date: string; result: 'W' | 'D' | 'L' }[]

  let winStreak = 0
  for (const r of resultsByDate) {
    if (r.result === 'W') {
      winStreak++
      if ((TEAM_EVENT.WIN_STREAK_MILESTONES as readonly number[]).includes(winStreak)) {
        const key = eventKey('win_streak', r.matchId, null, r.date)
        if (!existingSet.has(key)) {
          const payload: StreakPayload = {
            streak_length: winStreak,
            previous_best: winStreak,  // simplified: actual best would need historical data
            is_season_best: true,
          }
          inserts.push({
            team_id:           teamId,
            event_type:        'win_streak',
            event_date:        r.date,
            match_id:          r.matchId,
            featured_player_id: null,
            title:             winStreakTitle(winStreak),
            body:              winStreak >= 5 ? `Laget hittar sin bästa form. Varje match bygger vidare på den förra.` : `Momentum är på vår sida — håller vi det rullande?`,
            payload,
            captain_note:      null,
            is_pinned:         false,
            is_hidden:         false,
          })
          existingSet.add(key)
        }
      }
    } else {
      winStreak = 0
    }
    if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) break
  }

  if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) {
    await flush(svc, inserts)
    return
  }

  // ── personal_best events ───────────────────────────────────────────────────
  // Find matches where someone set a new career high (comparing against all earlier matches)
  const playerRunningBest = new Map<string, number>()
  for (const match of allMatches) {
    const matchResults = results.filter(r => r.match_id === match.id)
    for (const r of matchResults) {
      const highGame = Math.max(...(r.games ?? []).filter(g => g > 0), 0)
      if (!highGame) continue

      const prev = playerRunningBest.get(r.player_id) ?? 0
      if (highGame > prev) {
        if (prev > 0) {
          // This is genuinely a new best (prev > 0 means they played before)
          const key = eventKey('personal_best', match.id, r.player_id, match.date.slice(0, 10))
          if (!existingSet.has(key)) {
            const payload: PersonalBestPayload = {
              player_id:     r.player_id,
              player_name:   r.player?.name ?? 'Okänd',
              new_best:      highGame,
              previous_best: prev,
              match_id:      match.id,
            }
            inserts.push({
              team_id:           teamId,
              event_type:        'personal_best',
              event_date:        match.date.slice(0, 10),
              match_id:          match.id,
              featured_player_id: r.player_id,
              title:             personalBestTitle(r.player?.name ?? 'Okänd', highGame, highGame - prev),
              body:              `${highGame - prev} pins bättre än tidigare bästa på ${prev}. Kvällen tillhörde ${r.player?.name ?? 'spelaren'}.`,
              payload,
              captain_note:      null,
              is_pinned:         false,
              is_hidden:         false,
            })
            existingSet.add(key)
          }
        }
        playerRunningBest.set(r.player_id, highGame)
      }
    }
    if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) break
  }

  if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) {
    await flush(svc, inserts)
    return
  }

  // ── player_milestone events ────────────────────────────────────────────────
  const playerMatchCount = new Map<string, { count: number; name: string; lastDate: string }>()
  for (const match of allMatches) {
    const matchResults = results.filter(r => r.match_id === match.id)
    for (const r of matchResults) {
      const prev = playerMatchCount.get(r.player_id)
      const newCount = (prev?.count ?? 0) + 1
      playerMatchCount.set(r.player_id, {
        count: newCount,
        name: r.player?.name ?? 'Okänd',
        lastDate: match.date.slice(0, 10),
      })
      if ((TEAM_EVENT.PLAYER_MATCH_MILESTONES as readonly number[]).includes(newCount)) {
        const key = eventKey('player_milestone', match.id, r.player_id, match.date.slice(0, 10))
        if (!existingSet.has(key)) {
          const payload: PlayerMilestonePayload = {
            player_id:    r.player_id,
            player_name:  r.player?.name ?? 'Okänd',
            milestone:    newCount as 10 | 25 | 50 | 100,
            total_matches: newCount,
          }
          const ordinal = milestoneOrdinal(newCount)
          inserts.push({
            team_id:           teamId,
            event_type:        'player_milestone',
            event_date:        match.date.slice(0, 10),
            match_id:          match.id,
            featured_player_id: r.player_id,
            title:             `${r.player?.name ?? 'Okänd'}s ${ordinal} match`,
            body:              `Spelade sin ${ordinal} tävlingsmatch för laget.`,
            payload,
            captain_note:      null,
            is_pinned:         false,
            is_hidden:         false,
          })
          existingSet.add(key)
        }
      }
    }
    if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) break
  }

  if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) {
    await flush(svc, inserts)
    return
  }

  // ── form_rising events ─────────────────────────────────────────────────────
  // Check per player: recent 3-match avg vs season avg
  const playerResults = new Map<string, { name: string; avgs: number[] }>()
  for (const match of allMatches) {
    const matchResults = results.filter(r => r.match_id === match.id)
    for (const r of matchResults) {
      const matchAvg = calcMatchAvg(r.games)
      if (matchAvg === null) continue
      const entry = playerResults.get(r.player_id) ?? { name: r.player?.name ?? 'Okänd', avgs: [] }
      entry.avgs.push(matchAvg)
      playerResults.set(r.player_id, entry)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const lastMatch = allMatches[allMatches.length - 1]
  const lastMatchDate = lastMatch?.date?.slice(0, 10) ?? today

  for (const [playerId, { name, avgs }] of playerResults) {
    if (avgs.length < 4) continue  // need at least 4 matches for meaningful comparison
    const seasonAvg = Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length)
    const recent3   = avgs.slice(-3)
    const recentAvg = Math.round(recent3.reduce((a, b) => a + b, 0) / recent3.length)
    const delta     = recentAvg - seasonAvg

    if (delta >= TEAM_EVENT.FORM_RISING_DELTA) {
      const key = eventKey('form_rising', null, playerId, lastMatchDate)
      if (!existingSet.has(key)) {
        const payload: FormRisingPayload = {
          player_id:   playerId,
          player_name: name,
          delta,
          recent_avg:  recentAvg,
          season_avg:  seasonAvg,
          match_avgs:  avgs.slice(-8),
        }
        inserts.push({
          team_id:           teamId,
          event_type:        'form_rising',
          event_date:        lastMatchDate,
          match_id:          null,
          featured_player_id: playerId,
          title:             formRisingTitle(name, delta, recentAvg),
          body:              `Snittade ${recentAvg} de senaste tre matcherna — ${delta} pins över sitt säsongssnitt på ${seasonAvg}.`,
          payload,
          captain_note:      null,
          is_pinned:         false,
          is_hidden:         false,
        })
        existingSet.add(key)
      }
    }
    if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) break
  }

  await flush(svc, inserts)

  // ── Phase 2 + emotional events ────────────────────────────────────────────
  await syncPhase2(teamId, pub, svc, allMatches)
  await syncEmotionalEvents(teamId, svc, allMatches)
}

async function syncPhase2(
  teamId: string,
  pub: ReturnType<typeof createPublicSupabase>,
  svc: ReturnType<typeof createServiceSupabase>,
  completedMatches: RawMatch[]
): Promise<void> {
  const today   = new Date().toISOString().slice(0, 10)
  const inserts: PendingInsert[] = []

  // Existing phase-2 events for dedup
  const { data: existing } = await svc
    .from('team_events')
    .select('event_type,match_id,featured_player_id,event_date')
    .eq('team_id', teamId)
    .in('event_type', ['match_preview', 'division_climbed', 'lineup_announced'])

  const existingSet = new Set<string>(
    (existing ?? []).map(e =>
      eventKey(e.event_type, e.match_id ?? null, e.featured_player_id ?? null, e.event_date)
    )
  )

  // ── match_preview ──────────────────────────────────────────────────────────
  const { data: upcoming } = await pub
    .from('matches')
    .select('id,date,home_team_id,away_team_id,division,venue,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .eq('status', 'upcoming')
    .order('date', { ascending: true })
    .limit(3)

  const nowMs    = Date.now()
  const hours48  = TEAM_EVENT.MATCH_PREVIEW_HOURS * 60 * 60 * 1000

  for (const raw of (upcoming ?? []) as unknown as (RawMatch & { venue?: string | null })[]) {
    const matchMs = new Date(raw.date).getTime()
    if (matchMs - nowMs > hours48) continue   // too far away

    const matchDate = raw.date.slice(0, 10)
    const key       = eventKey('match_preview', raw.id, null, matchDate)
    if (existingSet.has(key)) continue

    const isHome   = raw.home_team_id === teamId
    const opponent = isHome ? raw.away : raw.home

    // H2H from already-fetched completed matches
    let h2hW = 0, h2hL = 0, h2hD = 0
    for (const m of completedMatches) {
      const mHome = m.home_team_id === teamId
      const mOpp  = mHome ? m.away_team_id : m.home_team_id
      if (mOpp !== opponent.id) continue
      const my  = mHome ? m.home_score : m.away_score
      const opp = mHome ? m.away_score : m.home_score
      const out = outcomeOf(my, opp)
      if (out === 'W') h2hW++
      else if (out === 'L') h2hL++
      else if (out === 'D') h2hD++
    }

    // Opponent's last 5 results
    const oppForm: ('W' | 'D' | 'L')[] = (upcoming ?? []).length > 0
      ? []  // simplified — real opponent form would need a separate query
      : []

    const h2hStr = h2hW + h2hL + h2hD > 0
      ? `Inbördes: ${h2hW}V ${h2hL}F ${h2hD}O.`
      : 'Första mötet.'
    const venue = isHome ? 'Hemmaplan' : 'Bortaplan'

    const payload: MatchPreviewPayload = {
      opponent_id:   opponent.id,
      opponent_name: opponent.name,
      match_date:    raw.date,
      is_home:       isHome,
      venue:         raw.venue ?? null,
      h2h_wins:      h2hW,
      h2h_losses:    h2hL,
      h2h_draws:     h2hD,
      opponent_form: oppForm,
    }

    inserts.push({
      team_id:           teamId,
      event_type:        'match_preview',
      event_date:        matchDate,
      match_id:          raw.id,
      featured_player_id: null,
      title:             matchPreviewTitle(opponent.name, raw.date, isHome),
      body:              `${h2hStr} ${venue}.`,
      payload,
      captain_note:      null,
      is_pinned:         true,   // preview is always pinned
      is_hidden:         false,
    })
    existingSet.add(key)
    break  // only the next match
  }

  // ── division_climbed ───────────────────────────────────────────────────────
  if (completedMatches.length > 0) {
    const division = completedMatches[0].division
    const { data: divisionMatches } = await pub
      .from('matches')
      .select('home_team_id,away_team_id,home_score,away_score')
      .eq('status', 'completed')
      .eq('division', division)
      .gte('date', SEASON.CURRENT)
      .not('home_score', 'is', null)

    if (divisionMatches) {
      const table = computeStandings(divisionMatches as unknown as SimpleMatch[])
      const row   = table.find(r => r.teamId === teamId)

      if (row) {
        // Find the most recent division_climbed event to compare
        const { data: lastClimb } = await svc
          .from('team_events')
          .select('payload')
          .eq('team_id', teamId)
          .eq('event_type', 'division_climbed')
          .order('event_date', { ascending: false })
          .limit(1)
          .single()

        const prevPosition = lastClimb
          ? ((lastClimb.payload as DivisionClimbedPayload).new_position ?? 99)
          : 99

        if (row.rank < prevPosition) {
          const key = eventKey('division_climbed', null, null, today)
          if (!existingSet.has(key)) {
            const payload: DivisionClimbedPayload = {
              new_position: row.rank,
              old_position: prevPosition >= 99 ? row.rank + 1 : prevPosition,
              total_teams:  table.length,
              division,
              points:       row.points,
            }
            inserts.push({
              team_id:           teamId,
              event_type:        'division_climbed',
              event_date:        today,
              match_id:          null,
              featured_player_id: null,
              title:             `Klättrade till ${row.rank}:e plats`,
              body:              `${row.points} poäng i ${division}.`,
              payload,
              captain_note:      null,
              is_pinned:         false,
              is_hidden:         false,
            })
            existingSet.add(key)
          }
        }
      }
    }
  }

  // ── lineup_announced ───────────────────────────────────────────────────────
  // Read published lineups from the lineups table (written by the captain on the intern page)
  const { data: lineups } = await svc
    .from('lineups')
    .select('id,match_id,created_at,lineup_slots(user_id,player_name,bord,position,is_reserve)')
    .eq('team_id', teamId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5)

  for (const lineup of (lineups ?? []) as unknown as RawLineup[]) {
    if (!lineup.match_id) continue
    const upcomingTyped = (upcoming ?? []) as unknown as RawMatch[]
    const matchDate = upcomingTyped.find(m => m.id === lineup.match_id)?.date?.slice(0, 10) ?? today
    const key = eventKey('lineup_announced', lineup.match_id, null, matchDate)
    if (existingSet.has(key)) continue

    const opponentMatch = ((upcoming ?? []) as unknown as (RawMatch & { venue?: string })[])
      .find(m => m.id === lineup.match_id)
    if (!opponentMatch) continue

    const isHome   = opponentMatch.home_team_id === teamId
    const opponent = isHome ? opponentMatch.away : opponentMatch.home

    const players = (lineup.lineup_slots ?? [])
      .filter(s => !s.is_reserve)
      .sort((a, b) => a.bord - b.bord || a.position - b.position)
      .map((s, i) => ({ id: s.user_id, name: s.player_name, position: i + 1 }))

    const payload: LineupAnnouncedPayload = {
      match_id:      lineup.match_id,
      match_date:    opponentMatch.date,
      opponent_name: opponent.name,
      is_home:       isHome,
      players,
    }

    inserts.push({
      team_id:           teamId,
      event_type:        'lineup_announced',
      event_date:        matchDate,
      match_id:          lineup.match_id,
      featured_player_id: null,
      title:             `Truppen mot ${opponent.name}`,
      body:              `${players.length} spelare klara för ${isHome ? 'hemmamatch' : 'bortamatch'}.`,
      payload,
      captain_note:      null,
      is_pinned:         false,
      is_hidden:         false,
    })
    existingSet.add(key)
  }

  await flush(svc, inserts)
}

// ── Standings helper (lightweight, used for division_climbed) ─────────────────

type SimpleMatch = { home_team_id: string; away_team_id: string; home_score: number; away_score: number }

function computeStandings(matches: SimpleMatch[]): Pick<TableRow, 'teamId' | 'rank' | 'points'>[] {
  const pts: Record<string, number> = {}
  for (const m of matches) {
    pts[m.home_team_id] = pts[m.home_team_id] ?? 0
    pts[m.away_team_id] = pts[m.away_team_id] ?? 0
    if (m.home_score > m.away_score)      { pts[m.home_team_id] += 2 }
    else if (m.home_score < m.away_score) { pts[m.away_team_id] += 2 }
    else                                   { pts[m.home_team_id] += 1; pts[m.away_team_id] += 1 }
  }
  return Object.entries(pts)
    .sort((a, b) => b[1] - a[1])
    .map(([teamId, points], i) => ({ teamId, rank: i + 1, points }))
}

type RawLineup = {
  id: string
  match_id: string | null
  created_at: string
  lineup_slots: { user_id: string; player_name: string; bord: number; position: number; is_reserve: boolean }[]
}

function formRisingTitle(name: string, delta: number, recentAvg: number): string {
  if (delta >= 15) return `${name} i karriärbästa form just nu`
  if (delta >= 10) return `${name} klättrar — ${delta} pins över snitt`
  return `Tre raka över snitt för ${name}`
}

function winStreakTitle(n: number): string {
  if (n >= 10) return `${n} raka — en historisk svit`
  if (n >= 7)  return `Sju matcher utan förlust`
  if (n === 5) return `Fem i rad — laget rullar`
  if (n === 3) return `Tre matcher, tre segrar`
  return `${n} raka utan förlust`
}

function personalBestTitle(name: string, newBest: number, delta: number): string {
  if (delta >= 20) return `${name} slår rekord med ${delta} pins`
  if (delta >= 10) return `${newBest} pins — ${name} skriver om rekordboken`
  return `${newBest} pins — ${name} kniper eget rekord`
}

function matchPreviewTitle(opponentName: string, dateStr: string, isHome: boolean): string {
  const d    = new Date(dateStr)
  const days = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']
  const day  = days[d.getDay()]
  if (isHome) return `${opponentName} kliver in på hemmaplan på ${day}`
  return `Bortamatch mot ${opponentName} på ${day}`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function eventKey(
  type: string,
  matchId: string | null,
  playerId: string | null,
  date: string
): string {
  return `${type}|${matchId ?? ''}|${playerId ?? ''}|${date}`
}

async function flush(
  svc: ReturnType<typeof createServiceSupabase>,
  inserts: PendingInsert[]
): Promise<void> {
  if (!inserts.length) return
  await svc.from('team_events').insert(inserts as unknown as TablesInsert<'team_events'>[])
}

function outcomeOf(my: number | null, opp: number | null): 'W' | 'D' | 'L' | null {
  if (my === null || opp === null) return null
  return my > opp ? 'W' : my < opp ? 'L' : 'D'
}

function calcMatchAvg(games: number[]): number | null {
  const valid = (games ?? []).filter(g => g > 0)
  return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null
}

function bestScorer(
  results: RawMatchResult[]
): { player_id: string; name: string; high: number } | null {
  let best: { player_id: string; name: string; high: number } | null = null
  for (const r of results) {
    const high = Math.max(...(r.games ?? []).filter(g => g > 0), 0)
    if (high > (best?.high ?? 0)) {
      best = { player_id: r.player_id, name: r.player?.name ?? 'Okänd', high }
    }
  }
  return best
}

function matchResultTitle(
  result: 'W' | 'D' | 'L',
  opponentName: string,
  myScore: number,
  oppScore: number,
  isHome: boolean,
): string {
  const margin = Math.abs(myScore - oppScore)
  if (result === 'W') {
    if (margin >= 4) return isHome ? `Dominerade hemma mot ${opponentName}` : `Tog hem det borta mot ${opponentName}`
    if (margin >= 2) return `Stark insats — ${opponentName} stoppades`
    return isHome ? `Höll undan hemma mot ${opponentName}` : `Kammade hem poängen borta mot ${opponentName}`
  }
  if (result === 'L') {
    if (margin >= 4) return `${opponentName} var för starka ikväll`
    if (margin >= 2) return isHome ? `${opponentName} vann på vår plan` : `Gick inte vägen borta mot ${opponentName}`
    return `Millimetern skilde mot ${opponentName}`
  }
  return `Delade poängen med ${opponentName}`
}

function matchResultBody(
  result: 'W' | 'D' | 'L',
  myScore: number,
  oppScore: number,
  isHome: boolean,
  topScorer: { player_id: string; name: string; high: number } | null
): string {
  const venue = isHome ? 'hemma' : 'borta'
  const hero  = topScorer ? `${topScorer.name} toppade med ${topScorer.high} pins.` : null
  if (result === 'W') {
    const base = `Tre poäng ${venue} med ${myScore}–${oppScore}.`
    return hero ? `${base} ${hero}` : base
  }
  if (result === 'L') {
    const base = hero
      ? `${hero} Räckte inte mot ${topScorer ? '' : ''}${myScore}–${oppScore} ${venue}.`
      : `Svårt ${venue}möte — föll ${myScore}–${oppScore}.`
    return base
  }
  return hero
    ? `Oavgjort ${myScore}–${oppScore} ${venue}. ${hero}`
    : `Delade poängen ${myScore}–${oppScore} ${venue}.`
}

function milestoneOrdinal(n: number): string {
  const suffixes: Record<number, string> = { 10: '10:e', 25: '25:e', 50: '50:e', 100: '100:e' }
  return suffixes[n] ?? `${n}:e`
}

// ── Emotional events (revenge_win, giant_killer) ───────────────────────────────

async function syncEmotionalEvents(
  teamId: string,
  svc: ReturnType<typeof createServiceSupabase>,
  completedMatches: RawMatch[]
): Promise<void> {
  if (completedMatches.length < 2) return

  const { data: existing } = await svc
    .from('team_events')
    .select('event_type,match_id,event_date')
    .eq('team_id', teamId)
    .in('event_type', ['revenge_win', 'giant_killer'])

  const existingSet = new Set<string>(
    (existing ?? []).map(e => eventKey(e.event_type, e.match_id ?? null, null, e.event_date))
  )

  // Build standings from all completed matches (for giant_killer)
  const allDivisionPts: Record<string, number> = {}
  for (const m of completedMatches) {
    allDivisionPts[m.home_team_id] = allDivisionPts[m.home_team_id] ?? 0
    allDivisionPts[m.away_team_id] = allDivisionPts[m.away_team_id] ?? 0
    if (m.home_score! > m.away_score!)      allDivisionPts[m.home_team_id] += 2
    else if (m.home_score! < m.away_score!) allDivisionPts[m.away_team_id] += 2
    else { allDivisionPts[m.home_team_id]++; allDivisionPts[m.away_team_id]++ }
  }
  const rankOf = (tid: string): number => {
    const sorted = Object.entries(allDivisionPts).sort((a, b) => b[1] - a[1])
    const idx    = sorted.findIndex(([id]) => id === tid)
    return idx === -1 ? 99 : idx + 1
  }

  const inserts: PendingInsert[] = []

  for (let i = 1; i < completedMatches.length; i++) {
    const match  = completedMatches[i]
    const isHome = match.home_team_id === teamId
    const my     = isHome ? match.home_score : match.away_score
    const opp    = isHome ? match.away_score : match.home_score
    if (my === null || opp === null || my <= opp) continue  // only wins

    const oppTeamId   = isHome ? match.away_team_id : match.home_team_id
    const oppTeamName = isHome ? match.away.name    : match.home.name
    const matchDate   = match.date.slice(0, 10)

    // ── revenge_win: beat an opponent who beat us in our last H2H meeting ─────
    const revKey = eventKey('revenge_win', match.id, null, matchDate)
    if (!existingSet.has(revKey)) {
      // Find previous H2H match between these two teams (earlier in the sorted list)
      const prevH2H = completedMatches.slice(0, i).reverse().find(m =>
        (m.home_team_id === teamId && m.away_team_id === oppTeamId) ||
        (m.away_team_id === teamId && m.home_team_id === oppTeamId)
      )
      if (prevH2H) {
        const prevIsHome = prevH2H.home_team_id === teamId
        const prevMy  = prevIsHome ? prevH2H.home_score : prevH2H.away_score
        const prevOpp = prevIsHome ? prevH2H.away_score : prevH2H.home_score
        if (prevMy !== null && prevOpp !== null && prevMy < prevOpp) {
          inserts.push({
            team_id: teamId, event_type: 'revenge_win',
            event_date: matchDate, match_id: match.id,
            featured_player_id: null,
            title:   `Hämnades mot ${oppTeamName}`,
            body:    `Vann efter att ha förlorat H2H förra gången.`,
            payload: { opponent_id: oppTeamId, opponent_name: oppTeamName, my_score: my, opp_score: opp },
            captain_note: null, is_pinned: false, is_hidden: false,
          })
          existingSet.add(revKey)
        }
      }
    }

    // ── giant_killer: beat a team ≥5 positions above us ───────────────────────
    const gkKey = eventKey('giant_killer', match.id, null, matchDate)
    if (!existingSet.has(gkKey)) {
      const myRank  = rankOf(teamId)
      const oppRank = rankOf(oppTeamId)
      if (oppRank !== 99 && myRank - oppRank >= TEAM_EVENT.GIANT_KILLER_GAP) {
        inserts.push({
          team_id: teamId, event_type: 'giant_killer',
          event_date: matchDate, match_id: match.id,
          featured_player_id: null,
          title:   `Slog ${oppRank === 1 ? 'serieledaren' : `${oppRank}:an i tabellen`}`,
          body:    `${my}–${opp} mot ett lag ${myRank - oppRank} platser högre upp.`,
          payload: { opponent_id: oppTeamId, opponent_name: oppTeamName, my_score: my, opp_score: opp, rank_gap: myRank - oppRank },
          captain_note: null, is_pinned: false, is_hidden: false,
        })
        existingSet.add(gkKey)
      }
    }

    if (inserts.length >= TEAM_EVENT.MAX_INSERT_PER_SYNC) break
  }

  await flush(svc, inserts)
}
