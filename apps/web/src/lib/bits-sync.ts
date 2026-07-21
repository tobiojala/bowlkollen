import 'server-only'
import { createServiceSupabase } from '@/lib/supabase-server'
import {
  getDivisions,
  getClubs,
  getTeamsByClub,
  getMatchesByDivision,
  getMatchScores,
  getMatchResults,
  getPlayersPage,
  getPlayerProfileDetail,
  parsePlayerTotals,
  parseMatchResults,
  type BitsClub,
  type BitsTeam,
} from '@/lib/bits-client'

// ─── result shape returned to admin UI ────────────────────────────────────────

export type SyncResult = {
  ok:      boolean
  synced:  number
  skipped: number
  errors:  string[]
}

// ─── divisions ────────────────────────────────────────────────────────────────

export async function syncBitsDivisions(seasonId = 2025): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const divs = await getDivisions(seasonId)
    const rows = divs.map(d => ({
      bits_division_id: Number(d.divisionId),
      season_id:        seasonId,
      name:             d.divisionName,
      synced_at:        new Date().toISOString(),
    }))

    const { error } = await db
      .from('bits_divisions')
      .upsert(rows, { onConflict: 'bits_division_id,season_id' })

    if (error) throw new Error(error.message)
    result.synced = rows.length
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

// ─── clubs ────────────────────────────────────────────────────────────────────

export async function syncBitsClubs(seasonId = 2025): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const clubs = await getClubs(seasonId)
    const rows = clubs.map((c: BitsClub) => ({
      bits_id:      c.clubId,
      name:         c.clubName,
      logo_url:     c.clubLogoUrl,
      county:       c.countyName,
      county_id:    c.countyId,
      hall_id:      c.hallId,
      hall_name:    c.hallName,
      is_active:    c.isActive,
      is_play_bowl: c.isPlayBowl,
      updated_at:   new Date().toISOString(),
    }))

    const BATCH = 200
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await db
        .from('bits_clubs')
        .upsert(rows.slice(i, i + BATCH), { onConflict: 'bits_id' })
      if (error) throw new Error(error.message)
    }
    result.synced = rows.length
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

// ─── teams for all clubs ──────────────────────────────────────────────────────

export async function syncBitsTeamsForAllClubs(seasonId = 2025): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  const { data: clubs, error: clubErr } = await db
    .from('bits_clubs')
    .select('bits_id')
    .eq('is_active', true)

  if (clubErr || !clubs) {
    result.ok = false
    result.errors.push(clubErr?.message ?? 'no clubs found — run syncBitsClubs first')
    return result
  }

  for (const { bits_id } of clubs) {
    try {
      const teams = await getTeamsByClub(bits_id, seasonId)
      if (!teams.length) { result.skipped++; continue }

      const rows = teams.map((t: BitsTeam) => ({
        bits_team_id:   t.teamId,
        bits_club_id:   bits_id,
        name:           t.teamName,
        team_alias:     t.teamAlias,
        hall_id:        null,
        hall_name:      null,
        team_type:      t.teamType,
        team_type_desc: t.teamTypeDesc,
        club_name:      null,
        updated_at:     new Date().toISOString(),
      }))

      const { error } = await db
        .from('bits_teams')
        .upsert(rows, { onConflict: 'bits_team_id' })
      if (error) throw new Error(error.message)
      result.synced += rows.length
    } catch (e) {
      result.errors.push(`club ${bits_id}: ${String(e)}`)
    }
  }

  if (result.errors.length > 0) result.ok = false
  return result
}

// ─── matches for one division ─────────────────────────────────────────────────

export async function syncBitsMatchesForDivision(
  divisionId: number,
  seasonId = 2025,
): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const matches = await getMatchesByDivision(divisionId, seasonId)
    if (!matches.length) { result.skipped = 1; return result }

    const rows = matches.map(m => ({
      bits_match_id:      m.matchId,
      season_id:          m.matchSeason || seasonId,
      bits_division_id:   m.matchDivisionId,
      division_name:      m.matchDivisionName,
      match_date:         m.matchDate.slice(0, 10),
      home_bits_team_id:  m.matchHomeTeamId,
      away_bits_team_id:  m.matchAwayTeamId,
      home_team_name:     m.matchHomeTeamName,
      away_team_name:     m.matchAwayTeamName,
      home_score:         m.matchHomeTeamScore || null,
      away_score:         m.matchAwayTeamScore || null,
      home_result:        m.matchHomeTeamResult,
      away_result:        m.matchAwayTeamResult,
      round_id:           m.matchRoundId,
      hall_name:          m.matchHallName,
      hall_city:          m.matchHallCity,
      oil_pattern:        m.matchOilPatternName,
      is_finished:        m.matchFinished,
      match_scheme_id:    m.matchSchemeId,
      synced_at:          new Date().toISOString(),
    }))

    const BATCH = 100
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await db
        .from('bits_matches')
        .upsert(rows.slice(i, i + BATCH), { onConflict: 'bits_match_id' })
      if (error) throw new Error(error.message)
    }
    result.synced = rows.length
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

// ─── matches for all divisions in a season ────────────────────────────────────

export async function syncBitsMatchesForSeason(seasonId = 2025): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  const { data: divs, error: divErr } = await db
    .from('bits_divisions')
    .select('bits_division_id')
    .eq('season_id', seasonId)

  if (divErr || !divs) {
    result.ok = false
    result.errors.push(divErr?.message ?? 'no divisions found — run syncBitsDivisions first')
    return result
  }

  for (const { bits_division_id } of divs) {
    const r = await syncBitsMatchesForDivision(bits_division_id, seasonId)
    result.synced  += r.synced
    result.skipped += r.skipped
    result.errors.push(...r.errors)
  }

  if (result.errors.length > 0) result.ok = false
  return result
}

// ─── match scores ─────────────────────────────────────────────────────────────

export async function syncBitsMatchScores(bitsMatchId: number): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const raw = await getMatchScores(bitsMatchId)
    const players = parsePlayerTotals(raw)

    if (!players.length) { result.skipped = 1; return result }

    // Build flat score rows from series × boards
    const rows: {
      bits_match_id: number
      player_name:   string
      serie:         number
      board:         number
      score:         number
      order_index:   number
      is_home_team:  boolean
    }[] = []

    raw.series.forEach((serie, serieIdx) => {
      // The outer `boards` array splits evenly in half: first half = home
      // team's board groups, second half = away team's. Verified against
      // known pin totals across multiple matches/divisions. This is NOT the
      // inner scores[] index — that's the rotating physical table, unrelated
      // to which team a player is on.
      const homeBoardCount = Math.floor(serie.boards.length / 2)
      serie.boards.forEach((board, boardIdx) => {
        board.scores.forEach((ps, orderIdx) => {
          const name = ps.playerName?.trim()
          const val  = parseInt(ps.score, 10)
          if (!name || isNaN(val) || val <= 0) return
          rows.push({
            bits_match_id: bitsMatchId,
            player_name:   name,
            serie:         serieIdx + 1,
            board:         boardIdx + 1,
            score:         val,
            order_index:   orderIdx,
            is_home_team:  boardIdx < homeBoardCount,
          })
        })
      })
    })

    // Deduplicate: BITS occasionally returns the same player+serie+board twice.
    // Postgres refuses to UPDATE the same row twice in one statement.
    const seen = new Set<string>()
    const uniqueRows = rows.filter(r => {
      const key = `${r.player_name}:${r.serie}:${r.board}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const { error: upsertErr } = await db
      .from('bits_match_scores')
      .upsert(uniqueRows, { onConflict: 'bits_match_id,player_name,serie,board' })

    if (upsertErr) throw new Error(upsertErr.message)

    await db
      .from('bits_matches')
      .update({ scores_synced: true, synced_at: new Date().toISOString() })
      .eq('bits_match_id', bitsMatchId)

    result.synced = rows.length
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

// ─── sync finished matches that are missing scores ────────────────────────────

export async function syncPendingMatchScores(limit = 50): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  const { data: pending, error: fetchErr } = await db
    .from('bits_matches')
    .select('bits_match_id')
    .eq('is_finished', true)
    .eq('scores_synced', false)
    .order('match_date', { ascending: false })
    .limit(limit)

  if (fetchErr || !pending) {
    result.ok = false
    result.errors.push(fetchErr?.message ?? 'query failed')
    return result
  }

  for (const { bits_match_id } of pending) {
    const r = await syncBitsMatchScores(bits_match_id)
    result.synced  += r.synced
    result.skipped += r.skipped
    result.errors.push(...r.errors)
  }

  if (result.errors.length > 0) result.ok = false
  return result
}

// ─── exact per-player results via BITS' own authoritative endpoint ───────────
// matchResult/GetMatchResults returns exact license number + full name + per-
// serie line per player, already split home/away — zero ambiguity, unlike
// GetMatchScores which only exposes BITS' abbreviated display names. This is
// the primary path going forward; syncBitsMatchScores above remains as a
// fallback for the rare case this endpoint or matchSchemeId is unavailable.

export async function syncBitsMatchResultsExact(bitsMatchId: number): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const { data: match, error: matchErr } = await db
      .from('bits_matches')
      .select('match_scheme_id')
      .eq('bits_match_id', bitsMatchId)
      .single()
    if (matchErr) throw new Error(matchErr.message)
    if (!match?.match_scheme_id) { result.skipped = 1; return result }

    const raw     = await getMatchResults(bitsMatchId, match.match_scheme_id)
    const players = parseMatchResults(raw)

    if (players.length > 0) {
      const rows = players.map(p => ({
        bits_match_id: bitsMatchId,
        lic_nbr:       p.licNbr,
        player_name:   p.fullName,
        is_home_team:  p.isHomeTeam,
        series:        p.series,
        total_result:  p.total,
      }))
      const { error: upsertErr } = await db
        .from('bits_match_player_results')
        .upsert(rows, { onConflict: 'bits_match_id,lic_nbr' })
      if (upsertErr) throw new Error(upsertErr.message)
      result.synced = rows.length
    } else {
      // Genuinely empty on BITS' side (walkover/forfeit) — not an error,
      // nothing more will ever come from re-fetching this match.
      result.skipped = 1
    }

    // Mark done either way — we've fetched everything BITS has for this
    // match, whether or not it produced player rows.
    await db
      .from('bits_matches')
      .update({ scores_synced: true, exact_results_synced: true, synced_at: new Date().toISOString() })
      .eq('bits_match_id', bitsMatchId)
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

export async function syncPendingExactResults(limit = 200): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  const { data: pending, error: fetchErr } = await db
    .from('bits_matches')
    .select('bits_match_id,match_scheme_id')
    .eq('is_finished', true)
    .eq('exact_results_synced', false)
    .order('match_date', { ascending: false })
    .limit(limit)

  if (fetchErr || !pending) {
    result.ok = false
    result.errors.push(fetchErr?.message ?? 'query failed')
    return result
  }
  if (!pending.length) { result.skipped = 1; return result }
  const pendingList = pending

  // 20 concurrent requests — same level already verified safe and fast
  // against the BITS API for the player-agreement backfill.
  const CONCURRENCY = 20
  let idx = 0
  async function worker() {
    while (idx < pendingList.length) {
      const { bits_match_id, match_scheme_id } = pendingList[idx++]
      if (!match_scheme_id) { result.skipped++; continue }
      try {
        const raw     = await getMatchResults(bits_match_id, match_scheme_id)
        const players = parseMatchResults(raw)

        if (players.length > 0) {
          const rows = players.map(p => ({
            bits_match_id,
            lic_nbr:      p.licNbr,
            player_name:  p.fullName,
            is_home_team: p.isHomeTeam,
            series:       p.series,
            total_result: p.total,
          }))
          const { error: upsertErr } = await db
            .from('bits_match_player_results')
            .upsert(rows, { onConflict: 'bits_match_id,lic_nbr' })
          if (upsertErr) throw new Error(upsertErr.message)
          result.synced += rows.length
        } else {
          // Genuinely empty on BITS' side (walkover/forfeit) — mark done so
          // it stops being re-selected as "pending" in every future round.
          result.skipped++
        }

        await db
          .from('bits_matches')
          .update({ scores_synced: true, exact_results_synced: true, synced_at: new Date().toISOString() })
          .eq('bits_match_id', bits_match_id)
      } catch (e) {
        result.errors.push(`match ${bits_match_id}: ${String(e)}`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  if (result.errors.length > 0) result.ok = false
  return result
}

// ─── sync all players from the SvBF player registry ──────────────────────────
// Fetches in pages of 200. The BITS player registry contains ~55k entries.
// lic_nbr is stored internally only — never exposed in the UI.

export async function syncBitsPlayers(): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  const TAKE = 200
  let skip = 0
  let total = Infinity

  try {
    while (skip < total) {
      const page = await getPlayersPage(skip, TAKE)
      total = page.total

      const rows = page.data
        // Skip dummy/international placeholder records
        .filter(p => p.licNbr && !p.licNbr.startsWith('DUM') && !p.licNbr.startsWith('INT'))
        .map(p => ({
          lic_nbr:           p.licNbr.trim(),
          first_name:        (p.firstName ?? '').trim(),
          sur_name:          (p.surName ?? '').trim(),
          club_name:         (p.clubName ?? '').trim() || null,
          licence_average:   p.licenceAverage ? Math.round(p.licenceAverage) : null,
          licence_skill_lvl: p.licenceSkillLevel ? Math.round(p.licenceSkillLevel) : null,
          lic_type_name:     (p.licTypeName ?? '').trim() || null,
          synced_at:         new Date().toISOString(),
        }))

      if (rows.length > 0) {
        const { error } = await db
          .from('bits_players')
          .upsert(rows, { onConflict: 'lic_nbr' })
        if (error) throw new Error(`skip=${skip}: ${error.message}`)
        result.synced += rows.length
      }

      skip += TAKE
    }
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

// ─── resolve abbreviated names in match scores to player license numbers ──────
// Runs a single SQL UPDATE joining bits_match_scores → bits_players on abbr_name.
// Only resolves where the abbreviated name is unambiguous (exactly one match).
// Safe to re-run — already-resolved rows are skipped by the WHERE clause.

export async function resolveBitsPlayerLicNbrs(): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const { data, error } = await db.rpc('resolve_bits_player_lic_nbrs')
    if (error) throw new Error(error.message)
    result.synced = (data as number | null) ?? 0
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

// ─── resolve remaining ambiguous names using the player's club ────────────────
// For names like "L. Andersson" that match many players nationally, narrow
// using which team (and therefore club) the player was on in that match.
// Safe to re-run — only fills NULLs.

export async function resolveBitsPlayerLicNbrsByClub(): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const { data, error } = await db.rpc('resolve_bits_player_lic_nbrs_by_club')
    if (error) throw new Error(error.message)
    result.synced = (data as number | null) ?? 0
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

// ─── one-time repair: fix home/away team assignment on already-synced rows ────
// The original parser derived is_home_team from the wrong dimension of the
// BITS response. Corrects every row in place using the verified rule:
// boards[0..half) = home, boards[half..end) = away. Safe to re-run.

export async function fixBitsHomeTeamAssignment(): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const { data, error } = await db.rpc('fix_bits_home_team_assignment')
    if (error) throw new Error(error.message)
    result.synced = (data as number | null) ?? 0
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

// ─── fetch dual-club agreement data for players who could resolve a stuck name ─
// Some players hold a secondary club "agreement" (loan/contract) only visible
// via the per-license player/PlayerProfileDetail endpoint — there's no bulk
// version. Scoped to candidates for currently-unresolved score rows (a few
// thousand, not the full ~55k registry). Safe to re-run — only processes
// players not yet checked (agreement_synced_at IS NULL); click repeatedly
// until skipped reaches 0.

async function getUnresolvedPlayerNames(db: ReturnType<typeof createServiceSupabase>): Promise<string[]> {
  const names = new Set<string>()
  let offset = 0
  for (;;) {
    const { data, error } = await db
      .from('bits_match_scores')
      .select('player_name')
      .is('bits_lic_nbr', null)
      .range(offset, offset + 999)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    for (const row of data) names.add(row.player_name)
    if (data.length < 1000) break
    offset += 1000
  }
  return [...names]
}

export async function syncBitsPlayerAgreements(limit = 3000): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const unresolvedNames = await getUnresolvedPlayerNames(db)
    if (!unresolvedNames.length) { result.skipped = 1; return result }

    const { data: candidates, error: candErr } = await db
      .from('bits_players')
      .select('lic_nbr')
      .in('abbr_name', unresolvedNames)
      .is('agreement_synced_at', null)
      .limit(limit)
    if (candErr) throw new Error(candErr.message)
    if (!candidates?.length) { result.skipped = 1; return result }
    const candidateList = candidates

    // 20 concurrent requests measured at ~19ms/call with zero errors against
    // the real BITS API — kept here rather than pushing higher, since this is
    // a third-party service we don't operate.
    const CONCURRENCY = 20
    let idx = 0
    async function worker() {
      while (idx < candidateList.length) {
        const { lic_nbr } = candidateList[idx++]
        try {
          const detail = await getPlayerProfileDetail(lic_nbr)
          const { error: updErr } = await db
            .from('bits_players')
            .update({
              agreement_club_id:   detail.agreementSecondClubId ?? null,
              agreement_club_name: detail.agreementSecondClubName ?? null,
              agreement_synced_at: new Date().toISOString(),
            })
            .eq('lic_nbr', lic_nbr)
          if (updErr) throw new Error(updErr.message)
          result.synced++
        } catch (e) {
          result.errors.push(`${lic_nbr}: ${String(e)}`)
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))

    if (result.errors.length > 0) result.ok = false
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}

export async function resolveBitsPlayerLicNbrsByAgreement(): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()

  try {
    const { data, error } = await db.rpc('resolve_bits_player_lic_nbrs_by_agreement')
    if (error) throw new Error(error.message)
    result.synced = (data as number | null) ?? 0
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}
