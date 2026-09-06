import type { Note, DiaryType } from '@/lib/diary'

// View helpers over a logbook entry (Note). Kept out of diary.ts (which holds the
// data hooks and is at its size budget).

/** A note's kind: explicit type, else "match" when tied to a fixture, else a plain note. */
export const noteType = (n: Note): DiaryType => n.entryType ?? (n.matchId != null ? 'match' : 'ovrigt')

/** Per-game totals (series) of a scored session, and its total + average. */
export const entrySeries = (n: Note): number[] => (n.games ?? []).map(g => g.total)
export const entryTotal = (n: Note): number => entrySeries(n).reduce((a, b) => a + b, 0)
export const entryAvg = (n: Note): number | null => { const s = entrySeries(n); return s.length ? Math.round(entryTotal(n) / s.length) : null }
