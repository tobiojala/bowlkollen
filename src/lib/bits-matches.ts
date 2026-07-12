import type { Database } from '@/lib/database.types'
import type { MatchRow } from '@/lib/division-standings'

export type DbMatchRow = Database['public']['Tables']['bits_matches']['Row']

/** bits_matches DB row → the lean MatchRow the schedule + standings use. */
export function toMatchRow(m: DbMatchRow): MatchRow {
  return {
    bits_match_id:     m.bits_match_id,
    home_bits_team_id: m.home_bits_team_id,
    away_bits_team_id: m.away_bits_team_id,
    home_team_name:    m.home_team_name,
    away_team_name:    m.away_team_name,
    home_result:       m.home_result,
    away_result:       m.away_result,
    is_finished:       m.is_finished,
    match_date:        m.match_date,
    round_id:          m.round_id,
    hall_name:         m.hall_name,
  }
}
