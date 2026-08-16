'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { QUERY } from '@/lib/constants'

const INK = '#f4f5f7'
const INK3 = 'rgba(244,245,247,0.56)'
const GOLD = '#f5c200'
const SURFACE2 = '#1c2127'
const HAIR = 'rgba(244,245,247,0.08)'

type Team = { id: string; name: string; club: string; city: string | null }
const ROLES = [
  { key: 'captain', label: 'Kapten' },
  { key: 'board', label: 'Styrelse' },
  { key: 'admin', label: 'Admin' },
] as const

// Become a captain/board member: search your team, pick a role, submit for
// review. Server-side club_claims land as `pending` — an admin verifies before
// any captain powers unlock (never granted from a self-declared role alone).
export default function ClubClaimPanel({ onClaimed }: { onClaimed: () => void }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Team[]>([])
  const [picked, setPicked] = useState<Team | null>(null)
  const [role, setRole] = useState<string>('captain')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (value: string) => {
    setQ(value); setPicked(null)
    if (value.trim().length < QUERY.SEARCH_MIN_CHARS) { setHits([]); return }
    const { data } = await createClient()
      .from('teams').select('id, name, club, city').ilike('club', `%${value.trim()}%`).limit(8)
    setHits((data as Team[]) ?? [])
  }

  const submit = async () => {
    if (!picked) return
    setBusy(true); setError(null)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setBusy(false); return }
    const { error: insErr } = await supabase.from('club_claims')
      .insert({ user_id: session.user.id, team_id: picked.id, role, status: 'pending' })
    setBusy(false)
    if (insErr) { setError('Kunde inte skicka. Försök igen.'); return }
    onClaimed()
  }

  const input: React.CSSProperties = {
    width: '100%', background: SURFACE2, border: `1px solid ${HAIR}`, borderRadius: 12,
    padding: '14px 16px', fontSize: 16, color: INK, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!picked ? (
        <>
          <div style={{ position: 'relative' }}>
            <Search size={18} color={INK3} style={{ position: 'absolute', left: 14, top: 15 }} />
            <input value={q} onChange={(e) => search(e.target.value)} placeholder="Sök din klubb" autoFocus style={{ ...input, paddingLeft: 42 }} />
          </div>
          {hits.map((t) => (
            <button key={t.id} onClick={() => setPicked(t)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left',
                background: SURFACE2, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 16px', cursor: 'pointer' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: INK }}>{t.name}</span>
              <span style={{ fontSize: 13, color: INK3 }}>{[t.club, t.city].filter(Boolean).join(' · ')}</span>
            </button>
          ))}
        </>
      ) : (
        <>
          <div style={{ background: SURFACE2, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>{picked.name}</div>
            <div style={{ fontSize: 13, color: INK3, marginTop: 2 }}>{[picked.club, picked.city].filter(Boolean).join(' · ')}</div>
            <button onClick={() => setPicked(null)} style={{ marginTop: 8, background: 'none', border: 'none', color: GOLD, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Byt lag</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ROLES.map((r) => (
              <button key={r.key} onClick={() => setRole(r.key)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  background: role === r.key ? 'rgba(245,194,0,0.14)' : SURFACE2,
                  border: `1px solid ${role === r.key ? 'rgba(245,194,0,0.4)' : HAIR}`,
                  color: role === r.key ? GOLD : INK }}>
                {r.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: INK3, lineHeight: 1.5 }}>
            Din roll granskas av en administratör innan du får ledarbehörighet.
          </div>
          {error && <div style={{ fontSize: 14, color: '#e05555' }}>{error}</div>}
          <button onClick={submit} disabled={busy}
            style={{ background: GOLD, color: '#1a1400', border: 'none', borderRadius: 999, padding: '14px', fontSize: 16, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}>
            {busy ? 'Skickar…' : 'Skicka för granskning'}
          </button>
        </>
      )}
    </div>
  )
}
