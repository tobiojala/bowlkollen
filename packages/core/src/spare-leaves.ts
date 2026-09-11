// Spare / leave analysis — one shared implementation so web + native agree on
// what a "leave" is, whether it's a hål (split), and how spare conversion
// aggregates. Pure logic over the pins left STANDING after the first ball.

/** Pins standing after the first ball, plus whether the frame was ultimately
 *  cleared on the second ball (a spare) or left open. */
export type LoggedLeave = { pins: number[]; converted: boolean }

/** Which pins physically touch, used to tell a hål (split) from a plain leave. */
export const PIN_ADJACENCY: Record<number, number[]> = {
  1: [2, 3], 2: [1, 3, 4, 5], 3: [1, 2, 5, 6], 4: [2, 5, 7, 8],
  5: [2, 3, 4, 6, 8, 9], 6: [3, 5, 9, 10], 7: [4, 8], 8: [4, 5, 7, 9],
  9: [5, 6, 8, 10], 10: [6, 9],
}

// Named leaves (Swedish bowling vernacular) for the common/famous ones.
const NAMED: Record<string, string> = {
  '4,6,7,10': 'Stora fyran', '7,10': '7–10', '4,6': '4–6', '8,10': '8–10',
  '4,7': '4–7', '6,7,10': '6–7–10', '4,7,10': '4–7–10', '2,7': '2–7',
  '3,10': '3–10', '5,7': '5–7', '5,10': '5–10',
}

const sorted = (pins: number[]): number[] => [...new Set(pins)].sort((a, b) => a - b)

/** Canonical key for a leave (sorted, comma-joined) — stable for storage/tally. */
export const leaveKey = (pins: number[]): string => sorted(pins).join(',')

/** Connected components of the standing pins under physical adjacency. */
function components(pins: number[]): number[][] {
  const set = new Set(pins), seen = new Set<number>(), out: number[][] = []
  for (const p of pins) {
    if (seen.has(p)) continue
    const stack = [p], comp: number[] = []; seen.add(p)
    while (stack.length) {
      const x = stack.pop() as number; comp.push(x)
      for (const q of PIN_ADJACENCY[x] ?? []) if (set.has(q) && !seen.has(q)) { seen.add(q); stack.push(q) }
    }
    out.push(comp)
  }
  return out
}

/** A hål (split): 2+ pins, headpin (1) already down, and a gap between them
 *  (more than one adjacency cluster). */
export function isSplit(pins: number[]): boolean {
  const s = sorted(pins)
  return s.length >= 2 && !s.includes(1) && components(s).length > 1
}

export type LeaveKind = 'single' | 'hal' | 'multi'
export function leaveKind(pins: number[]): LeaveKind {
  const s = sorted(pins)
  if (s.length === 1) return 'single'
  return isSplit(s) ? 'hal' : 'multi'
}

/** Display name: "10:an" for a single pin, a known name for famous leaves,
 *  else the pin list ("3–6–10"). */
export function leaveName(pins: number[]): string {
  const s = sorted(pins)
  if (s.length === 0) return 'Rent'
  if (s.length === 1) return `${s[0]}:an`
  return NAMED[s.join(',')] ?? s.join('–')
}

export type LeaveStat = { key: string; name: string; kind: LeaveKind; made: number; att: number; pct: number }
export type SpareStats = {
  overall: { made: number; att: number; pct: number }
  byKind: Record<LeaveKind, { made: number; att: number; pct: number }>
  byLeave: LeaveStat[]              // most-faced first
  nemesis: LeaveStat | null         // lowest-converting leave with enough attempts
}

const pct = (made: number, att: number): number => (att ? Math.round((made / att) * 100) : 0)

/** Aggregate logged leaves into spare-conversion stats. `minNemesis` = attempts
 *  a leave needs before it can be flagged as the nemesis (avoids one-off noise). */
export function aggregateSpares(leaves: LoggedLeave[], minNemesis = 5): SpareStats {
  const tally = new Map<string, { made: number; att: number; kind: LeaveKind }>()
  for (const l of leaves) {
    if (!l.pins.length) continue
    const k = leaveKey(l.pins)
    const e = tally.get(k) ?? { made: 0, att: 0, kind: leaveKind(l.pins) }
    e.att++; if (l.converted) e.made++
    tally.set(k, e)
  }
  const byLeave: LeaveStat[] = [...tally.entries()]
    .map(([key, e]) => ({ key, name: leaveName(key.split(',').map(Number)), kind: e.kind, made: e.made, att: e.att, pct: pct(e.made, e.att) }))
    .sort((a, b) => b.att - a.att)

  const kinds: LeaveKind[] = ['single', 'multi', 'hal']
  const byKind = kinds.reduce((acc, k) => {
    const rows = byLeave.filter(r => r.kind === k)
    const made = rows.reduce((s, r) => s + r.made, 0), att = rows.reduce((s, r) => s + r.att, 0)
    acc[k] = { made, att, pct: pct(made, att) }
    return acc
  }, {} as Record<LeaveKind, { made: number; att: number; pct: number }>)

  const made = byLeave.reduce((s, r) => s + r.made, 0), att = byLeave.reduce((s, r) => s + r.att, 0)
  const nemesis = byLeave.filter(r => r.att >= minNemesis).sort((a, b) => a.pct - b.pct)[0] ?? null

  return { overall: { made, att, pct: pct(made, att) }, byKind, byLeave, nemesis }
}
