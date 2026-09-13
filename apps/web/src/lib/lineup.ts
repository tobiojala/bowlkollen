// Pure functions — no DB access, fully testable

import type { RosterPlayer, LineupSlot } from './queries'

export type SlotPosition = { bord: number; pos: number; isReserve: boolean }
export type SeatablePerson = { publicId: string; name: string }

const BOARDS = [1, 2, 3, 4]

const STARTING_SLOTS: SlotPosition[] = BOARDS.flatMap(bord =>
  [1, 2].map(pos => ({ bord, pos, isReserve: false })),
)

const isStarterAt = (slots: LineupSlot[], bord: number, pos: number) =>
  slots.some(s => !s.isReserve && s.bord === bord && s.pos === pos)

/** Fill the empty starter slots from `pool` (already ranked, best first), never
 * moving players already seated. Mirrors native LineupSeating.suggest(): stops
 * when the pool runs out. Reserves are left untouched. */
export function suggestLineup(current: LineupSlot[], pool: SeatablePerson[]): LineupSlot[] {
  const next = [...current]
  const taken = new Set(next.map(s => s.publicId))
  const available = pool.filter(p => !taken.has(p.publicId))
  let pi = 0
  for (const bord of BOARDS) {
    for (const pos of [1, 2]) {
      if (isStarterAt(next, bord, pos)) continue
      const c = available[pi++]
      if (!c) return next
      next.push({ publicId: c.publicId, playerName: c.name, bord, pos, isReserve: false })
    }
  }
  return next
}

/** Seat a proven konstellation into the first fully-empty banpar (a@pos1, b@pos2).
 * No-op if every banpar already has at least one starter. Removes the pair from
 * any slot they already hold so they can't be double-seated. */
export function seatPairIntoBoard(current: LineupSlot[], a: SeatablePerson, b: SeatablePerson): LineupSlot[] {
  const bord = BOARDS.find(bd => ![1, 2].some(p => isStarterAt(current, bd, p)))
  if (!bord) return current
  const next = current.filter(s => s.publicId !== a.publicId && s.publicId !== b.publicId)
  next.push({ publicId: a.publicId, playerName: a.name, bord, pos: 1, isReserve: false })
  next.push({ publicId: b.publicId, playerName: b.name, bord, pos: 2, isReserve: false })
  return next
}

/** All 8 starting slots (bord 1-4 × pos 1-2) filled — reserves don't count.
 * Mirrors save_team_lineup's server-side publish check, so the UI can
 * disable "Publish" before the round-trip confirms it. */
export function isLineupComplete(slots: SlotPosition[]): boolean {
  return STARTING_SLOTS.every(req =>
    slots.some(s => s.bord === req.bord && s.pos === req.pos && !s.isReserve),
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
