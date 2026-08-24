import 'server-only'
import { createServiceSupabase } from '@/lib/supabase-server'
import {
  getClosedCompetitions,
  getCompetitionResult,
  competitionTotals,
  type BitsCompetitionResultRow,
} from '@/lib/bits-competitions'

export type SyncResult = { ok: boolean; synced: number; skipped: number; errors: string[] }

const MAX_CLASSES = 40 // safety cap when walking a competition's classes (resultRowNbr)
const RESULT_BATCH = 200

const isoDate = (s: string | null | undefined): string | null => {
  if (!s) return null
  const d = s.slice(0, 10)
  return d && d !== '0001-01-01' ? d : null
}

// ─── competitions catalog for a season ────────────────────────────────────────

export async function syncBitsCompetitions(seasonId: number): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()
  try {
    const comps = await getClosedCompetitions(seasonId)
    if (!comps.length) { result.skipped = 1; return result }
    const rows = comps.map(c => ({
      bits_competition_id: c.id,
      season_id:           seasonId,
      name:                c.name,
      hall:                c.hall,
      hall_city:           c.hallCity,
      hall_id:             c.hallId,
      club:                c.club,
      start_date:          isoDate(c.startDate),
      end_date:            isoDate(c.endDate),
      final_date:          isoDate(c.finalDate),
      status:              c.competitionStatus,
      synced_at:           new Date().toISOString(),
    }))
    // Upsert without touching results_synced (default false on first insert; kept
    // as-is on re-sync so already-fetched results aren't re-queued).
    const { error } = await db.from('bits_competitions').upsert(rows, { onConflict: 'bits_competition_id', ignoreDuplicates: false })
    if (error) throw new Error(error.message)
    result.synced = rows.length
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }
  return result
}

// ─── per-player results for one competition ───────────────────────────────────

export async function syncBitsCompetitionResults(competitionId: number): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()
  try {
    const rows: ReturnType<typeof toResultRow>[] = []
    for (let rn = 1; rn <= MAX_CLASSES; rn++) {
      const classRows = await getCompetitionResult(competitionId, rn)
      if (!classRows.length) break // classes are contiguous — first empty ends the walk
      for (const r of classRows) rows.push(toResultRow(competitionId, r))
    }

    if (rows.length) {
      for (let i = 0; i < rows.length; i += RESULT_BATCH) {
        const { error } = await db.from('bits_competition_results')
          .upsert(rows.slice(i, i + RESULT_BATCH), { onConflict: 'bits_competition_id,result_row_nbr,result_sort_order' })
        if (error) throw new Error(error.message)
      }
    }
    await db.from('bits_competitions').update({ results_synced: true }).eq('bits_competition_id', competitionId)
    result.synced = rows.length
  } catch (e) {
    result.ok = false
    result.errors.push(String(e))
  }
  return result
}

function toResultRow(competitionId: number, r: BitsCompetitionResultRow) {
  const { pins, games } = competitionTotals(r)
  const lic = r.resultLicNbr?.trim()
  return {
    bits_competition_id: competitionId,
    result_row_nbr:      r.resultRowNbr,
    result_sort_order:   r.resultSortOrder,
    lic_nbr:             lic || null,
    player_name:         r.licenseName ?? null,
    club_name:           r.clubName ?? null,
    place:               r.resultPlace ?? null,
    rank_points:         r.rankPoints ?? null,
    strength_points:     r.resultRankPoint ?? null,
    hcp:                 r.resultHcp ?? null,
    total_pins:          pins,
    total_games:         games,
    class_rounds:        r.classRounds ?? null,
    class_hcp:           r.classHcp ?? null,
    class_desperado:     r.classDesperado ?? null,
    synced_at:           new Date().toISOString(),
  }
}

// ─── pending-based results backfill (nightly-cron friendly) ───────────────────

export async function syncPendingCompetitionResults(limit = 20): Promise<SyncResult> {
  const result: SyncResult = { ok: true, synced: 0, skipped: 0, errors: [] }
  const db = createServiceSupabase()
  const { data, error } = await db
    .from('bits_competitions')
    .select('bits_competition_id')
    .eq('results_synced', false)
    .order('start_date', { ascending: false })
    .limit(limit)
  if (error) { result.ok = false; result.errors.push(error.message); return result }

  for (const { bits_competition_id } of (data ?? []) as { bits_competition_id: number }[]) {
    const r = await syncBitsCompetitionResults(bits_competition_id)
    result.synced += r.synced
    result.errors.push(...r.errors)
  }
  if (result.errors.length) result.ok = false
  return result
}
