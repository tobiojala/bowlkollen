'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { playerSearchTokens } from '@bowlkollen/core'
import { useColors } from '@/components/ThemeProvider'
import { ChevronRight, Search, Flame } from 'lucide-react'
import { prefetchPlayer } from '@/lib/prefetch'
import { useBitsTopScores } from '@/lib/queries'
import { QUERY } from '@/lib/constants'
import { IdentityAvatar } from '@/components/IdentityAvatar'

type SearchHit = { publicId: string; name: string; clubName: string | null; licenceAverage: number | null }

export default function PlayersPage() {
  const { C, isDark } = useColors()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const qc      = useQueryClient()
  const pending = useRef<Record<string, boolean>>({})

  // No query yet: show currently-hot players (real, last-90-days top scores)
  // instead of trying to "browse all" — there are 55k+ real synced players,
  // a flat list isn't viable at that scale.
  const { data: hot = [], isLoading: hotLoading } = useBitsTopScores()

  const firePlayer = useCallback((id: string) => {
    if (pending.current[id]) return
    pending.current[id] = true
    prefetchPlayer(qc, id).finally(() => { pending.current[id] = false })
  }, [qc])

  useEffect(() => {
    if (query.trim().length < QUERY.SEARCH_MIN_CHARS) { setResults([]); setSearching(false); return }
    setSearching(true)
    const t = setTimeout(async () => {
      let pq = createClient()
        .from('bits_players')
        .select('public_id,first_name,sur_name,club_name,licence_average')
      for (const w of playerSearchTokens(query)) pq = pq.or(`first_name.ilike.%${w}%,sur_name.ilike.%${w}%`)
      const { data } = await pq
        .order('licence_average', { ascending: false, nullsFirst: false })
        .limit(30)
      setResults((data ?? []).map(p => ({
        publicId: p.public_id, name: `${p.first_name} ${p.sur_name}`.trim(),
        clubName: p.club_name, licenceAverage: p.licence_average,
      })))
      setSearching(false)
    }, 220)
    return () => clearTimeout(t)
  }, [query])

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
    borderBottom: `1px solid ${C.border}`, textDecoration: 'none',
  }

  const avatar = (name: string) => <IdentityAvatar name={name} size={38} />

  const showingSearch = query.trim().length >= QUERY.SEARCH_MIN_CHARS

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Search */}
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px' }}>
            <Search size={15} color={C.muted} />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Sök spelare..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 14 }}
            />
          </div>
        </div>

        {showingSearch ? (
          <>
            {searching && (
              <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Söker…</div>
            )}
            {!searching && results.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Inga spelare hittades</div>
            )}
            {!searching && results.map(p => (
              <Link key={p.publicId} href={`/players/${p.publicId}`}
                style={rowStyle}
                onMouseEnter={e => { firePlayer(p.publicId); e.currentTarget.style.background = C.card }}
                onTouchStart={() => firePlayer(p.publicId)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {avatar(p.name)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{p.name}</div>
                  {p.clubName && <div style={{ fontSize: 11, color: C.muted }}>{p.clubName}</div>}
                </div>
                {p.licenceAverage != null && (
                  <span style={{ fontSize: 15, fontWeight: 800, color: C.accent, minWidth: 28, textAlign: 'right' }}>
                    {p.licenceAverage}
                  </span>
                )}
                <ChevronRight size={14} color={C.muted} style={{ flexShrink: 0 }} />
              </Link>
            ))}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px 4px' }}>
              <Flame size={13} color={C.accent} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>HETA SPELARE</span>
            </div>
            {hotLoading && (
              <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Laddar…</div>
            )}
            {!hotLoading && hot.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Sök efter en spelare ovan</div>
            )}
            {!hotLoading && hot.map(p => p.publicId && (
              <Link key={p.publicId} href={`/players/${p.publicId}`}
                style={rowStyle}
                onMouseEnter={e => { firePlayer(p.publicId!); e.currentTarget.style.background = C.card }}
                onTouchStart={() => firePlayer(p.publicId!)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {avatar(p.playerName)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{p.playerName}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{p.division}</div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.accent, minWidth: 28, textAlign: 'right' }}>
                  {p.total}
                </span>
                <ChevronRight size={14} color={C.muted} style={{ flexShrink: 0 }} />
              </Link>
            ))}
          </>
        )}
      </div>
    </main>
  )
}
