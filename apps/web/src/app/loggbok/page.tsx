'use client'

import { useMemo, useState } from 'react'
import { useDiaryEntries, noteDate, type DiaryType } from '@/lib/diary'
import { noteType } from '@/lib/logbook'
import { useMyPublicId } from '@/lib/my-claim'
import { usePlayerBitsResults, useSession } from '@/lib/queries'
import { SerieBars } from '@/components/SerieBars'
import { LogEntryRow, fmtDate } from '@/components/logbook/LogEntryRow'
import { LogEntrySheet } from '@/components/logbook/LogEntrySheet'
import type { BitsPlayerMatchRow } from '@/lib/types'

const INK = '#f4f5f7', INK2 = 'rgba(244,245,247,0.72)', INK3 = 'rgba(244,245,247,0.56)', INK4 = 'rgba(244,245,247,0.34)', GOLD = '#f5c200', SURFACE = '#14171c', SURFACE2 = '#1c2127', HAIR = 'rgba(244,245,247,0.08)'

type Filter = 'alla' | DiaryType
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'alla', label: 'Alla' }, { key: 'traning', label: 'Träning' },
  { key: 'tavling', label: 'Tävling' }, { key: 'match', label: 'Match' },
]

// A league match woven into the timeline — the player's own line (series + total).
function LeagueMatchRow({ m }: { m: BitsPlayerMatchRow }) {
  const avg = m.series.length ? Math.round(m.totalResult / m.series.length) : 0
  return (
    <div style={{ borderBottom: `1px solid ${HAIR}`, padding: '12px 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: INK2, background: SURFACE2, borderRadius: 999, padding: '3px 9px' }}>MATCH</span>
        <span style={{ fontSize: 13, color: INK3 }}>{fmtDate(m.matchDate)}</span>
        {m.divisionName && <span style={{ fontSize: 13, color: INK3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {m.divisionName}</span>}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: INK4, letterSpacing: '0.04em' }}>FRÅN SERIEN</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginTop: 6 }}>{m.isHomeTeam ? '' : '@ '}{m.opponentName}</div>
      {m.series.length > 0 && <div style={{ marginTop: 8 }}><SerieBars series={m.series} /></div>}
      <div style={{ fontSize: 13, color: INK3, marginTop: 8 }}><span className="num" style={{ color: INK, fontWeight: 700 }}>{m.totalResult}</span> · ⌀ {avg}</div>
    </div>
  )
}

export default function LoggbokPage() {
  const { data: session } = useSession()
  const { data: entries = [] } = useDiaryEntries()
  const { data: publicId = '' } = useMyPublicId()
  const { data: matches = [] } = usePlayerBitsResults(publicId)
  const [filter, setFilter] = useState<Filter>('alla')
  const [adding, setAdding] = useState(false)

  // Unified timeline: logbook entries + the player's league matches, newest first.
  const items = useMemo(() => {
    const entryItems = entries.map((n) => ({ date: noteDate(n), kind: 'entry' as const, note: n, type: noteType(n) }))
    const matchItems = matches.map((m) => ({ date: m.matchDate, kind: 'match' as const, m, type: 'match' as DiaryType }))
    return [...entryItems, ...matchItems]
      .filter((it) => filter === 'alla' || it.type === filter)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [entries, matches, filter])

  if (!session) return null

  return (
    <main style={{ minHeight: '100vh', background: '#0b0d10', color: INK }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 120px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: INK3, textTransform: 'uppercase' }}>Min loggbok</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2 }}>Loggbok</h1>
            <div style={{ fontSize: 14, color: INK3, marginTop: 4 }}>Din privata logg — träning, tävling, matcher.</div>
          </div>
          <button onClick={() => setAdding(true)}
            style={{ flexShrink: 0, marginTop: 6, background: GOLD, color: '#0b0d10', border: 'none', borderRadius: 999, padding: '10px 16px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
            + Ny
          </button>
        </div>

        <div style={{ display: 'flex', gap: 7, margin: '18px 0 6px', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ border: `1px solid ${filter === f.key ? INK : INK4}`, background: filter === f.key ? INK : 'transparent',
                color: filter === f.key ? '#0b0d10' : INK2, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: INK4, fontSize: 14, padding: '48px 20px' }}>
            {filter === 'alla' ? 'Inget loggat än — tryck + Ny för att börja.' : 'Inget här än.'}
          </div>
        ) : (
          <div>
            {items.map((it) => it.kind === 'entry'
              ? <LogEntryRow key={`e${it.note.id}`} note={it.note} />
              : <LeagueMatchRow key={`m${it.m.matchDate}-${it.m.opponentName}`} m={it.m} />)}
          </div>
        )}
      </div>

      {adding && <LogEntrySheet onClose={() => setAdding(false)} />}
    </main>
  )
}
