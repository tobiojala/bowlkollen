'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Bookmark, Trash2, MapPin, Droplet, ChevronRight, X } from 'lucide-react'
import { useSession } from '@/lib/queries'
import {
  usePrepMatch, useMatchNotes, useHallNotes, useSaveNote, useDeleteNote,
  useMatchPattern, useSetMatchPattern, useOilProfiles, usePatternHistory, type Note,
} from '@/lib/diary'
import ScoutingCard from './ScoutingCard'

const BG = '#0b0d10'
const INK = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const INK4 = 'rgba(244,245,247,0.34)'
const GOLD = '#f5c200'
const SURFACE = '#14171c'
const HAIR = 'rgba(244,245,247,0.08)'

function fmt(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PrepClient({ matchId }: { matchId: number }) {
  const router = useRouter()
  const { data: session, isLoading } = useSession()
  const { data: match } = usePrepMatch(matchId)
  const { data: matchNotes = [] } = useMatchNotes(matchId)
  const { data: hallNotes = [] } = useHallNotes(match?.hall)
  const save = useSaveNote()
  const del = useDeleteNote()
  const { data: pattern = null } = useMatchPattern(matchId)
  const setPattern = useSetMatchPattern()
  const { data: patternHistory = [] } = usePatternHistory(pattern, matchId)
  const [draft, setDraft] = useState('')
  const [patternOpen, setPatternOpen] = useState(false)

  if (!isLoading && !session) { if (typeof window !== 'undefined') window.location.href = '/login'; return null }

  // Recall = notes from earlier visits to this center, not this match.
  const recall = hallNotes.filter((n) => n.matchId !== matchId)
  const scoutMatch = match
    ? { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId, homeName: match.homeName, awayName: match.awayName }
    : null

  const choosePattern = (p: string | null) => {
    if (match) setPattern.mutate({ matchId, pattern: p, hall: match.hall })
    setPatternOpen(false)
  }

  const submit = () => {
    const body = draft.trim()
    if (!body || !match) return
    save.mutate({ body, matchId, hall: match.hall }, { onSuccess: () => setDraft('') })
  }

  return (
    <main style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: "var(--font-body,'DM Sans'),system-ui" }}>
      <div style={{ padding: '16px 24px 96px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: INK2, fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '4px 0', alignSelf: 'flex-start' }}>
          <ChevronLeft size={20} color={INK2} /> Tillbaka
        </button>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: INK3, letterSpacing: '0.12em' }}>MATCHFÖRBEREDELSE</div>
          {match ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.4, margin: '8px 0 6px', lineHeight: 1.2 }}>
                {match.homeName} <span style={{ color: INK4 }}>–</span> {match.awayName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: INK3, fontSize: 15 }}>
                <span>{fmt(match.date)}</span>
                {match.hall && (
                  <>
                    <span style={{ color: INK4 }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={15} color={INK3} />{match.hall}</span>
                  </>
                )}
                {match.division && <><span style={{ color: INK4 }}>·</span><span>{match.division}</span></>}
              </div>
            </>
          ) : (
            <div style={{ marginTop: 16, color: INK3 }}>Laddar…</div>
          )}
        </div>

        {/* Oil pattern chip → picker */}
        <div>
          <button onClick={() => setPatternOpen((o) => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
              background: SURFACE, border: `1px solid ${pattern ? 'rgba(245,194,0,0.3)' : HAIR}` }}>
            <Droplet size={18} color={pattern ? GOLD : INK3} fill={pattern ? GOLD : 'none'} />
            <span style={{ flex: 1, textAlign: 'left', fontSize: 16, fontWeight: pattern ? 700 : 500, color: pattern ? INK : INK3 }}>
              {pattern ?? 'Lägg till oljebild'}
            </span>
            {pattern
              ? <span onClick={(e) => { e.stopPropagation(); choosePattern(null) }}><X size={18} color={INK4} /></span>
              : <ChevronRight size={18} color={INK4} />}
          </button>
          {patternOpen && <OilPicker current={pattern} onPick={choosePattern} />}
        </div>

        {/* Inför mötet — head-to-head vs the opponent's roster */}
        <ScoutingCard match={scoutMatch} />

        {/* Note composer */}
        <div style={{ background: SURFACE, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Anteckning inför matchen — bana, olja, klot, känsla…"
            rows={3}
            style={{ width: '100%', resize: 'vertical', background: 'transparent', border: 'none', outline: 'none',
              color: INK, fontSize: 16, lineHeight: 1.5, fontFamily: 'inherit' }}
          />
          <button onClick={submit} disabled={!draft.trim() || save.isPending}
            style={{ alignSelf: 'flex-end', background: GOLD, color: '#1a1400', border: 'none', borderRadius: 999, padding: '10px 20px',
              fontSize: 15, fontWeight: 700, cursor: !draft.trim() || save.isPending ? 'default' : 'pointer', opacity: !draft.trim() || save.isPending ? 0.5 : 1 }}>
            {save.isPending ? 'Sparar…' : 'Spara'}
          </button>
        </div>

        {/* This match's notes */}
        {matchNotes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: INK3, letterSpacing: '0.12em', padding: '4px 2px' }}>DENNA MATCH</div>
            {matchNotes.map((n) => <NoteRow key={n.id} note={n} onDelete={() => del.mutate(n.id)} />)}
          </div>
        )}

        {/* Cross-center recall: same oil pattern elsewhere */}
        {pattern && patternHistory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 2px' }}>
              <Droplet size={16} color={GOLD} fill={GOLD} />
              <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: '0.1em' }}>SAMMA OLJEBILD — {pattern.toUpperCase()}</span>
            </div>
            {patternHistory.map((n) => <NoteRow key={n.id} note={n} onDelete={() => del.mutate(n.id)} muted />)}
          </div>
        )}

        {/* Recall from earlier visits to this center */}
        {recall.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 2px' }}>
              <Bookmark size={16} color={GOLD} fill={GOLD} />
              <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: '0.1em' }}>
                SENAST PÅ {match?.hall?.toUpperCase()}
              </span>
            </div>
            {recall.map((n) => <NoteRow key={n.id} note={n} onDelete={() => del.mutate(n.id)} muted />)}
          </div>
        )}
      </div>
    </main>
  )
}

function NoteRow({ note, onDelete, muted }: { note: Note; onDelete: () => void; muted?: boolean }) {
  return (
    <div style={{ background: muted ? 'transparent' : SURFACE, border: muted ? `1px solid ${HAIR}` : 'none',
      borderRadius: 16, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, color: INK2, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{note.body}</div>
        <div style={{ fontSize: 13, color: INK4, marginTop: 8 }}>{fmt(note.createdAt)}</div>
      </div>
      <button onClick={onDelete} aria-label="Ta bort anteckning"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
        <Trash2 size={18} color={INK4} />
      </button>
    </div>
  )
}

function OilPicker({ current, onPick }: { current: string | null; onPick: (p: string) => void }) {
  const { data: profiles = [] } = useOilProfiles()
  const [free, setFree] = useState('')
  return (
    <div style={{ marginTop: 8, background: SURFACE, borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8 }}>
        <input value={free} onChange={(e) => setFree(e.target.value)} placeholder="Egen oljebild…"
          style={{ flex: 1, background: BG, border: `1px solid ${HAIR}`, borderRadius: 10, padding: '10px 12px', color: INK, fontSize: 15, outline: 'none' }} />
        <button onClick={() => free.trim() && onPick(free.trim())} disabled={!free.trim()}
          style={{ background: GOLD, color: '#1a1400', border: 'none', borderRadius: 999, padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: free.trim() ? 'pointer' : 'default', opacity: free.trim() ? 1 : 0.5 }}>
          Välj
        </button>
      </div>
      {profiles.map((p) => (
        <button key={p.name} onClick={() => onPick(p.name)}
          style={{ display: 'flex', alignItems: 'baseline', gap: 8, textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
            background: current === p.name ? 'rgba(245,194,0,0.10)' : 'transparent', border: 'none' }}>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: current === p.name ? GOLD : INK }}>{p.name}</span>
          {p.lengthFt != null && <span style={{ fontSize: 13, color: INK3 }}>{p.lengthFt} ft</span>}
          {p.category && <span style={{ fontSize: 13, color: INK4 }}>{p.category}</span>}
        </button>
      ))}
    </div>
  )
}
