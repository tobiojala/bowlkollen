'use client'

import { useState } from 'react'
import { COLOR, FONT } from '@/lib/brand'
import type { Game } from '@bowlkollen/core'
import { useSaveDiaryEntry } from '@/lib/diary'
import { LogGame } from './LogGame'
import { EntryMeta, todayISO, type EntryMetaValue } from './EntryMeta'

const EMPTY: EntryMetaValue = { type: 'traning', date: todayISO(), hall: '', note: '', ballIds: [], oil: '' }

// One logging session: score serie after serie on the pin deck (each captures its
// leaves), then attach the context — center, oil, käglor, a note — and save it as a
// single loggbok entry. Shared by Mina spel and the loggbok quick entry.
export function SessionLogger({ onSaved, defaultType }: { onSaved?: () => void; defaultType?: EntryMetaValue['type'] }) {
  const save = useSaveDiaryEntry()
  const [games, setGames] = useState<Game[]>([])
  const [meta, setMeta] = useState<EntryMetaValue>({ ...EMPTY, type: defaultType ?? 'traning' })

  const total = games.reduce((a, g) => a + g.total, 0)
  const avg = games.length ? Math.round(total / games.length) : 0
  const canSave = games.length > 0 || meta.note.trim().length > 0

  const submit = () => {
    if (!canSave) return
    save.mutate(
      { body: meta.note, hall: meta.hall.trim() || null, type: meta.type, date: meta.date, games, oilPattern: meta.oil, ballIds: meta.ballIds },
      { onSuccess: () => { setGames([]); setMeta({ ...EMPTY, type: defaultType ?? 'traning' }); onSaved?.() } },
    )
  }

  return (
    <div>
      <LogGame onComplete={(g) => setGames((gs) => [...gs, g])} />

      {games.length > 0 && (
        <div style={{ marginTop: 22, border: `1px solid ${COLOR.hairline}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 16px', background: COLOR.surface }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: COLOR.ink3 }}>{games.length} serie{games.length > 1 ? 'r' : ''} i loggen</span>
            <span style={{ fontSize: 13, color: COLOR.ink3 }}><span style={{ fontFamily: FONT.score, fontWeight: 800, color: COLOR.ink }}>{total}</span> tot · ⌀ {avg}</span>
          </div>
          {games.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: `1px solid ${COLOR.hairline}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: COLOR.ink4, width: 58 }}>SERIE {i + 1}</span>
              <span style={{ flex: 1, fontFamily: FONT.score, fontWeight: 800, fontSize: 18 }}>{g.total}</span>
              <button onClick={() => setGames((gs) => gs.filter((_, k) => k !== i))} aria-label="Ta bort serie"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLOR.ink4, fontSize: 13, fontWeight: 600 }}>Ta bort</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <EntryMeta value={meta} onChange={setMeta} />
      </div>

      <button onClick={submit} disabled={!canSave || save.isPending}
        style={{ width: '100%', marginTop: 18, padding: 14, borderRadius: 12, border: 'none', cursor: canSave ? 'pointer' : 'default',
          background: canSave ? COLOR.gold : COLOR.surface2, color: canSave ? COLOR.bg : COLOR.ink3, fontFamily: FONT.body, fontSize: 15, fontWeight: 800, opacity: save.isPending ? 0.6 : 1 }}>
        Spara i loggboken
      </button>
    </div>
  )
}
