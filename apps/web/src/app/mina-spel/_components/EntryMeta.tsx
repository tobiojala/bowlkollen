'use client'

import Link from 'next/link'
import { COLOR, FONT } from '@/lib/brand'
import { useOilProfiles, type DiaryType } from '@/lib/diary'
import { useMyBalls } from '@/lib/balls'

export type EntryMetaValue = {
  type: DiaryType; date: string; hall: string; note: string; ballIds: string[]; oil: string
}
const TYPES: { key: DiaryType; label: string }[] = [
  { key: 'traning', label: 'Träning' }, { key: 'tavling', label: 'Tävling' },
  { key: 'match', label: 'Match' }, { key: 'ovrigt', label: 'Övrigt' },
]
export const todayISO = () => new Date().toISOString().slice(0, 10)
const field: React.CSSProperties = { width: '100%', background: COLOR.surface2, border: `1px solid ${COLOR.hairline}`, borderRadius: 12, padding: '11px 14px', color: COLOR.ink, fontSize: 15, fontFamily: FONT.body }

// The context around a logged session — type, when, where, on what oil, with which
// käglor, and a note. Shared by Mina spel and the loggbok quick entry so both
// capture the same picture. Balls come from the bowler's own arsenal.
export function EntryMeta({ value, onChange }: { value: EntryMetaValue; onChange: (v: EntryMetaValue) => void }) {
  const set = <K extends keyof EntryMetaValue>(k: K, v: EntryMetaValue[K]) => onChange({ ...value, [k]: v })
  const { data: balls = [] } = useMyBalls()
  const { data: oils = [] } = useOilProfiles()
  const toggleBall = (id: string) =>
    set('ballIds', value.ballIds.includes(id) ? value.ballIds.filter((b) => b !== id) : [...value.ballIds, id])
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: COLOR.ink3, margin: '2px 0 8px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {TYPES.map((t) => (
          <button key={t.key} onClick={() => set('type', t.key)}
            style={{ flex: 1, minHeight: 38, borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: FONT.body,
              background: value.type === t.key ? COLOR.gold : 'transparent', border: `1px solid ${value.type === t.key ? COLOR.gold : COLOR.ink4}`, color: value.type === t.key ? COLOR.bg : COLOR.ink2 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input type="date" value={value.date} max={todayISO()} onChange={(e) => set('date', e.target.value)} style={{ ...field, flex: 1 }} aria-label="Datum" />
        <input type="text" value={value.hall} onChange={(e) => set('hall', e.target.value)} placeholder="Center" style={{ ...field, flex: 1 }} aria-label="Center" />
      </div>

      <div>
        <div style={lbl}>Klot</div>
        {balls.length === 0 ? (
          <Link href="/arsenal/add" style={{ fontSize: 14, color: COLOR.ink3, textDecoration: 'none' }}>Lägg till klot i din arsenal →</Link>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {balls.map((b) => {
              const on = value.ballIds.includes(b.id)
              return (
                <button key={b.id} onClick={() => toggleBall(b.id)}
                  style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: FONT.body, borderRadius: 999, padding: '7px 13px',
                    background: on ? COLOR.ink : 'transparent', color: on ? COLOR.bg : COLOR.ink2, border: `1px solid ${on ? COLOR.ink : COLOR.hairline}` }}>
                  {b.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <div style={lbl}>Oljeprofil</div>
        <input list="oil-profiles" value={value.oil} onChange={(e) => set('oil', e.target.value)} placeholder="Oljeprofil (valfritt)" style={field} />
        <datalist id="oil-profiles">
          {oils.map((o) => <option key={o.name} value={o.name}>{o.lengthFt ? `${o.name} · ${o.lengthFt} ft` : o.name}</option>)}
        </datalist>
      </div>

      <textarea value={value.note} onChange={(e) => set('note', e.target.value)} placeholder="Hur gick det? Vad testade du?" rows={3} style={{ ...field, resize: 'vertical' }} />
    </div>
  )
}
