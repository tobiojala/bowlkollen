'use client'

import { Trash2, MapPin } from 'lucide-react'
import { useDeleteNote, noteDate, type DiaryType, type Note } from '@/lib/diary'
import { noteType, entrySeries, entryAvg, entryTotal } from '@/lib/logbook'

const INK = '#f4f5f7', INK3 = 'rgba(244,245,247,0.56)', INK4 = 'rgba(244,245,247,0.34)', GOLD = '#f5c200', SURFACE2 = '#1c2127', HAIR = 'rgba(244,245,247,0.08)'
const LABEL: Record<DiaryType, string> = { traning: 'Träning', tavling: 'Tävling', match: 'Match', ovrigt: 'Övrigt' }

export function fmtDate(d: string): string {
  const dt = new Date(d + 'T12:00:00')
  if (isNaN(dt.getTime())) return d
  const now = new Date()
  return dt.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', ...(dt.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
}

// One logbook entry — type badge, date, hall, scored games (series + snitt), note.
export function LogEntryRow({ note }: { note: Note }) {
  const del = useDeleteNote()
  const t = noteType(note)
  return (
    <div style={{ borderBottom: `1px solid ${HAIR}`, padding: '12px 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'rgba(244,245,247,0.72)', background: SURFACE2, borderRadius: 999, padding: '3px 9px' }}>{LABEL[t]}</span>
        <span style={{ fontSize: 13, color: INK3 }}>{fmtDate(noteDate(note))}</span>
        {note.hall && <span style={{ fontSize: 13, color: INK3, display: 'inline-flex', alignItems: 'center', gap: 3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><MapPin size={12} />{note.hall}</span>}
        <span style={{ flex: 1 }} />
        <button onClick={() => { if (window.confirm('Ta bort anteckningen?')) del.mutate(note.id) }} aria-label="Ta bort"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}><Trash2 size={16} color={INK4} /></button>
      </div>
      {note.games && note.games.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px', marginTop: 8 }}>
          <span className="num" style={{ display: 'flex', gap: 8, fontSize: 15, fontWeight: 700, color: INK }}>
            {entrySeries(note).map((s, i) => <span key={i} style={{ color: s >= 250 ? GOLD : INK }}>{s}</span>)}
          </span>
          <span style={{ fontSize: 13, color: INK3 }}>· ⌀ {entryAvg(note)} · {entryTotal(note)} tot</span>
        </div>
      )}
      {note.body && <div style={{ fontSize: 15, color: INK, lineHeight: 1.5, marginTop: 6, whiteSpace: 'pre-wrap' }}>{note.body}</div>}
    </div>
  )
}
