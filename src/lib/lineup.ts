// Pure functions — no DB access, fully testable

import type { RosterPlayer } from './queries'

export type SlotPosition = { bord: number; position: number; isReserve: boolean }

const STARTING_SLOTS: SlotPosition[] = [1, 2, 3, 4].flatMap(bord =>
  [1, 2].map(position => ({ bord, position, isReserve: false })),
)

/** All 8 starting slots (bord 1-4 × position 1-2) filled — reserves don't
 * count. Mirrors save_team_lineup's server-side publish check, so the UI can
 * disable "Publish" before the round-trip confirms it. */
export function isLineupComplete(slots: SlotPosition[]): boolean {
  return STARTING_SLOTS.every(req =>
    slots.some(s => s.bord === req.bord && s.position === req.position && !s.isReserve),
  )
}

const AVAILABILITY_RANK: Record<string, number> = { yes: 0, maybe: 1, no: 3 }

/** Roster ordered for the picker: available players first (yes, then maybe,
 * then no answer yet, then no), then by licence average — the captain sees
 * who can actually play before anything else. */
export function sortRosterForPicker(
  roster: RosterPlayer[], availabilityByPublicId: Record<string, string | undefined>,
): RosterPlayer[] {
  return [...roster].sort((a, b) => {
    const aRank = AVAILABILITY_RANK[availabilityByPublicId[a.publicId] ?? ''] ?? 2
    const bRank = AVAILABILITY_RANK[availabilityByPublicId[b.publicId] ?? ''] ?? 2
    if (aRank !== bRank) return aRank - bRank
    return (b.licenceAverage ?? 0) - (a.licenceAverage ?? 0)
  })
}
