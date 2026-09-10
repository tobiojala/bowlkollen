import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceSupabase } from './supabase-server'
import { getPlayerRanking, type BitsRankingRow } from './bits-ranking'

export type SyncResult = { ok: boolean; synced: number; skipped: number; errors: string[] }

// Current bowling season (Jul→Jun; season_id = starting calendar year) — the
// snapshot label for today's rolling ranking.
function currentSeason(): number {
  const now = new Date()
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
}

function toRow(seasonId: number, r: BitsRankingRow) {
  return {
    season_id:            seasonId,
    lic_nbr:              r.licenseNumber,
    player_name:          r.playerName,
    club_name:            r.clubName,
    place_male:           r.placeMale || null,
    place_female:         r.placeFemale || null,
    rank_points:          r.rankPoints,
    average:              r.average,
    average_bonus_points: r.averageBonusPoints,
    total_rounds:         r.totalRounds,
    skill_level:          r.skillLevel,
    skill_level_average:  r.skillLevelAverage,
    hcp:                  r.hcp,
    gender:               r.gender,
    in_active:            r.inActive,
    synced_at:            new Date().toISOString(),
  }
}

// Pull the full national ranking and upsert it. Paged (BITS returns ~15k rows);
// `maxPages` caps a single run so it stays under the function time budget.
export async function syncBitsPlayerRanking(maxPages = 40): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase() as unknown as SupabaseClient
  const seasonId = currentSeason()
  const TAKE = 1000

  try {
    for (let page = 0; page < maxPages; page++) {
      const { rows, total } = await getPlayerRanking(page * TAKE, TAKE)
      if (rows.length === 0) break

      // Only rows with a licence number can key to bits_players.
      const mapped = rows.filter(r => r.licenseNumber).map(r => toRow(seasonId, r))
      result.skipped += rows.length - mapped.length

      for (let i = 0; i < mapped.length; i += 500) {
        const { error } = await db
          .from('bits_player_ranking')
          .upsert(mapped.slice(i, i + 500), { onConflict: 'season_id,lic_nbr' })
        if (error) throw new Error(error.message)
      }
      result.synced += mapped.length

      if ((page + 1) * TAKE >= total) break
    }
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }

  return result
}
