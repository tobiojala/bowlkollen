'use client'

import { useState } from 'react'
import { X, ListChecks } from 'lucide-react'
import { useSaveDiaryEntry, type DiaryType } from '@/lib/diary'
import { Scoreboard } from '@/components/Scoreboard'
import type { Game } from '@bowlkollen/core'

const INK = '#f4f5f7', INK2 = 'rgba(244,245,247,0.72)', INK3 = 'rgba(244,245,247,0.56)', INK4 = 'rgba(244,245,247,0.34)', GOLD = '#f5c200', SURFACE = '#14171c', SURFACE2 = '#1c2127', HAIR = 'rgba(244,245,247,0.08)'
const TYPES: DiaryType[] = ['traning', 'tavling', 'match', 'ovrigt']
const LABEL: Record<DiaryType, string> = { traning: 'Träning', tavling: 'Tävling', match: 'Match', ovrigt: 'Övrigt' }
const todayISO = () => new Date().toISOString().slice(0, 10)

// Add a logbook entry — type, date, hall, note, and optional scored games (scoreboard).
export function LogEntrySheet({ onClose }: { onClose: () => void }) {
  const save = useSaveDiaryEntry()
  const [type, setType] = useState<DiaryType>('traning')
  const [date, setDate] = useState(todayISO())
  const [hall, setHall] = useState('')
  const [body, setBody] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [board, setBoard] = useState(false)

  const canSave = body.trim().length > 0 || games.length > 0
  const submit = () => { if (canSave) save.mutate({ body, hall: hall.trim() || null, type, date, games }, { onSuccess: onClose }) }
  const field: React.CSSProperties = { width: '100%', background: SURFACE2, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 14px', color: INK, fontSize: 15, fontFamily: 'inherit' }
  const gTotal = games.reduce((a, g) => a + g.total, 0)
  const gAvg = games.length ? Math.round(gTotal / games.length) : 0

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
          <button onClick={() => setBoard(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', cursor: 'pointer', background: SURFACE2, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 14px', color: INK }}>
            <ListChecks size={20} color={games.length ? GOLD : INK3} />
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{games.length ? `${games.length} spel · ⌀ ${gAvg} · ${gTotal} tot` : 'Lägg till spel'}</span>
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
