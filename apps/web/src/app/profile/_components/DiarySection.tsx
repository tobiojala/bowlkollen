'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import { useDiaryEntries } from '@/lib/diary'
import { LogEntryRow } from '@/components/logbook/LogEntryRow'
import { LogEntrySheet } from '@/components/logbook/LogEntrySheet'

const INK = '#f4f5f7', INK2 = 'rgba(244,245,247,0.72)', INK3 = 'rgba(244,245,247,0.56)', GOLD = '#f5c200'

// Compact Loggbok preview on the profile — the last few entries + a doorway to the
// full /loggbok page (timeline, league matches, filters).
export default function DiarySection() {
  const { data: entries = [] } = useDiaryEntries()
  const [adding, setAdding] = useState(false)

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '4px 2px 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: INK3, letterSpacing: '0.12em' }}>LOGGBOK</span>
        {entries.length > 0 && (
          <button onClick={() => setAdding(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: INK2 }}>Ny anteckning</button>
        )}
      </div>

      {entries.length === 0 ? (
        <button onClick={() => setAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'rgba(245,194,0,0.08)', border: '1px solid rgba(245,194,0,0.24)' }}>
          <Plus size={24} color={GOLD} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: INK }}>Börja föra loggbok</span>
            <span style={{ display: 'block', fontSize: 14, color: INK3, marginTop: 2 }}>Logga träning, tävling och matcher — privat, bara för dig.</span>
          </span>
        </button>
      ) : (
        <div>
          {entries.slice(0, 3).map((n) => <LogEntryRow key={n.id} note={n} />)}
          <Link href="/loggbok" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '12px', marginTop: 4, fontSize: 14, fontWeight: 700, color: INK2, textDecoration: 'none' }}>
            Öppna loggboken <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {adding && <LogEntrySheet onClose={() => setAdding(false)} />}
    </div>
  )
}
