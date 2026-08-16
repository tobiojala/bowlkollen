'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { QUERY } from '@/lib/constants'

const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.72)'
const INK3 = 'rgba(244,245,247,0.56)'
const GOLD = '#f5c200'
const SURFACE = '#14171c'
const HAIR = 'rgba(244,245,247,0.08)'

type Hit = { id: string; name: string; club: string }

// Connect-your-player flow: search BITS, enter licence number, submit the claim.
// Adults with a matching licence verify instantly; juniors always go to review.
export default function ClaimPanel({ onClaimed }: { onClaimed: () => void }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [picked, setPicked] = useState<Hit | null>(null)
  const [lic, setLic] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (value: string) => {
    setQ(value)
    setPicked(null)
    if (value.trim().length < QUERY.SEARCH_MIN_CHARS) { setHits([]); return }
    const { data } = await createClient()
      .from('bits_players').select('public_id, first_name, sur_name, club_name')
      .or(`first_name.ilike.%${value.trim()}%,sur_name.ilike.%${value.trim()}%`).limit(8)
    setHits((data ?? []).map((p) => ({
      id: p.public_id, name: `${p.first_name} ${p.sur_name}`.trim(), club: p.club_name ?? '',
    })))
  }

  const submit = async () => {
    if (!picked) return
    setBusy(true); setError(null)
    const { data, error: rpcError } = await createClient()
      .rpc('submit_player_claim', { p_public_id: picked.id, p_lic_nbr: lic.trim() })
    setBusy(false)
    if (rpcError || !data) { setError('Kunde inte koppla. Kontrollera licensnumret och försök igen.'); return }
    onClaimed()
  }

  const input: React.CSSProperties = {
    width: '100%', background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 12,
    padding: '14px 16px', fontSize: 16, color: INK, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!picked ? (
        <>
          <div style={{ position: 'relative' }}>
            <Search size={18} color={INK3} style={{ position: 'absolute', left: 14, top: 15 }} />
            <input
              value={q}
              onChange={(e) => search(e.target.value)}
              placeholder="Sök ditt namn"
              autoFocus
              style={{ ...input, paddingLeft: 42 }}
            />
          </div>
          {hits.map((h) => (
            <button key={h.id} onClick={() => setPicked(h)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left',
                background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 16px', cursor: 'pointer' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: INK }}>{h.name}</span>
              {h.club && <span style={{ fontSize: 13, color: INK3 }}>{h.club}</span>}
            </button>
          ))}
        </>
      ) : (
        <>
          <div style={{ background: SURFACE, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>{picked.name}</div>
            {picked.club && <div style={{ fontSize: 13, color: INK3, marginTop: 2 }}>{picked.club}</div>}
            <button onClick={() => setPicked(null)}
              style={{ marginTop: 8, background: 'none', border: 'none', color: GOLD, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              Byt spelare
            </button>
          </div>
          <input
            value={lic}
            onChange={(e) => setLic(e.target.value)}
            placeholder="Licensnummer"
            inputMode="numeric"
            style={input}
          />
          <div style={{ fontSize: 13, color: INK3, lineHeight: 1.5 }}>
            Ditt licensnummer verifierar att profilen är din. Juniorer granskas alltid manuellt.
          </div>
          {error && <div style={{ fontSize: 14, color: '#e05555' }}>{error}</div>}
          <button onClick={submit} disabled={busy || !lic.trim()}
            style={{ background: GOLD, color: '#1a1400', border: 'none', borderRadius: 999, padding: '14px', fontSize: 16, fontWeight: 700,
              cursor: busy || !lic.trim() ? 'default' : 'pointer', opacity: busy || !lic.trim() ? 0.5 : 1 }}>
            {busy ? 'Kopplar…' : 'Koppla profilen'}
          </button>
        </>
      )}
    </div>
  )
}
