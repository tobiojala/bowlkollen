'use client'

import { useState } from 'react'
import { Plus, X, Trash2, MapPin, ListChecks } from 'lucide-react'
import { useDiaryEntries, useSaveDiaryEntry, useDeleteNote, noteDate, type DiaryType, type Note } from '@/lib/diary'
import { noteType, entrySeries, entryAvg, entryTotal } from '@/lib/logbook'
import { Scoreboard } from '@/components/Scoreboard'
import type { Game } from '@bowlkollen/core'

const INK = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const INK4 = 'rgba(244,245,247,0.34)'
const GOLD = '#f5c200'
const SURFACE = '#14171c'
const SURFACE2 = '#1c2127'
const HAIR = 'rgba(244,245,247,0.08)'

const TYPES: DiaryType[] = ['traning', 'tavling', 'match', 'ovrigt']
const LABEL: Record<DiaryType, string> = { traning: 'Träning', tavling: 'Tävling', match: 'Match', ovrigt: 'Övrigt' }
const todayISO = () => new Date().toISOString().slice(0, 10)
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T12:00:00')
  if (isNaN(dt.getTime())) return d
  const now = new Date()
  return dt.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', ...(dt.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
}

// DAGBOK — the player's private diary (Remember pillar). Match-prep notes plus
// standalone entries for training and competitions outside league play.
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
          {entries.map((n) => <EntryRow key={n.id} note={n} />)}
        </div>
      )}

      {adding && <AddSheet onClose={() => setAdding(false)} />}
    </div>
  )
}

function EntryRow({ note }: { note: Note }) {
  const del = useDeleteNote()
  const t = noteType(note)
  return (
    <div style={{ borderBottom: `1px solid ${HAIR}`, padding: '12px 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: INK2, background: SURFACE2, borderRadius: 999, padding: '3px 9px' }}>{LABEL[t]}</span>
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

function AddSheet({ onClose }: { onClose: () => void }) {
  const save = useSaveDiaryEntry()
  const [type, setType] = useState<DiaryType>('traning')
  const [date, setDate] = useState(todayISO())
  const [hall, setHall] = useState('')
  const [body, setBody] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [board, setBoard] = useState(false)

  const canSave = body.trim().length > 0 || games.length > 0
  const submit = () => {
    if (!canSave) return
    save.mutate({ body, hall: hall.trim() || null, type, date, games }, { onSuccess: onClose })
  }
  const field: React.CSSProperties = { width: '100%', background: SURFACE2, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 14px', color: INK, fontSize: 15, fontFamily: 'inherit' }
  const gamesTotal = games.reduce((a, g) => a + g.total, 0)
  const gamesAvg = games.length ? Math.round(gamesTotal / games.length) : 0

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, background: SURFACE, borderRadius: '20px 20px 0 0', padding: 20, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: INK }}>Ny anteckning</span>
          <button onClick={onClose} aria-label="Stäng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={24} color={INK3} /></button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              style={{ flex: 1, minHeight: 40, borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: type === t ? GOLD : 'transparent', border: `1px solid ${type === t ? GOLD : INK4}`, color: type === t ? '#0b0d10' : INK2 }}>
              {LABEL[t]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} style={field} aria-label="Datum" />
          <input type="text" value={hall} onChange={(e) => setHall(e.target.value)} placeholder="Hall (valfritt)" style={field} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hur gick det? Vad testade du?" rows={4} style={{ ...field, resize: 'vertical' }} />

          {/* Scoreboard — fill in the games you bowled this session */}
          <button onClick={() => setBoard(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', cursor: 'pointer',
              background: SURFACE2, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 14px', color: INK }}>
            <ListChecks size={20} color={games.length ? GOLD : INK3} />
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{games.length ? `${games.length} spel · ⌀ ${gamesAvg} · ${gamesTotal} tot` : 'Lägg till spel'}</span>
            <span style={{ fontSize: 13, color: INK3 }}>{games.length ? 'Ändra' : 'Poängräkning'}</span>
          </button>
        </div>

        <button onClick={submit} disabled={!canSave || save.isPending}
          style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 12, border: 'none', cursor: canSave ? 'pointer' : 'default',
            background: canSave ? GOLD : SURFACE2, color: canSave ? '#0b0d10' : INK3, fontSize: 15, fontWeight: 800, opacity: save.isPending ? 0.6 : 1 }}>
          Spara
        </button>
      </div>

      {board && <Scoreboard initial={games} onClose={() => setBoard(false)} onSave={(g) => { setGames(g); setBoard(false) }} />}
    </div>
  )
}
