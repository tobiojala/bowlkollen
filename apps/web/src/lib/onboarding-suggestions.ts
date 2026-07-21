import type { PlayerSuggestion, PlayerSuggestionTier } from './types'

type RosterRow = { public_id: string; name: string; licence_average: number | null }

/**
 * Tags and orders roster rows from three separate get_team_roster() calls
 * into one ranked list — teammates first, then regional Elitserien, then
 * division rivals, matching the locked onboarding suggestion order.
 */
export function composePlayerSuggestions(
  teammates: RosterRow[],
  elitserienRosters: RosterRow[],
  rivalRosters: RosterRow[],
): PlayerSuggestion[] {
  const tag = (rows: RosterRow[], tier: PlayerSuggestionTier): PlayerSuggestion[] =>
    rows.map(r => ({ publicId: r.public_id, name: r.name, licenceAverage: r.licence_average, tier }))

  return [
    ...tag(teammates, 'teammate'),
    ...tag(elitserienRosters, 'elitserien_regional'),
    ...tag(rivalRosters, 'division_rival'),
  ]
}
