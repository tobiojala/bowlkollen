'use client'

import { useDiaryEntries } from '@/lib/diary'
import { aggregateSpares, type SpareStats, type LoggedLeave } from '@bowlkollen/core'

// Your spare stats, built from every leave captured across your logged games
// (logbook entries' games jsonb). Owner-only data — the diary hook reads the
// signed-in user's own notes.
export function usePlayerSpares(): { stats: SpareStats; total: number } {
  const { data: notes = [] } = useDiaryEntries()
  const leaves: LoggedLeave[] = []
  for (const n of notes)
    for (const g of n.games ?? [])
      for (const l of g.leaves ?? [])
        if (l.pins?.length) leaves.push({ pins: l.pins, converted: l.converted })
  return { stats: aggregateSpares(leaves), total: leaves.length }
}
