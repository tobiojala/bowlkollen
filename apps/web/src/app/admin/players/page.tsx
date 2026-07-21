'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useColors } from '@/components/ThemeProvider'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { shortName } from '@/lib/utils'

type Player = {
  id: string
  name: string
  teamId: string | null
  teamName: string
  avg: number | null
  bitsStatus: 'verified' | 'unverified' | null  // placeholder — needs BITS sync
}

export default function AdminPlayersPage() {
  const { C } = useColors()
  const [players, setPlayers]   = useState<Player[]>([])
  const [loading, setLoading]   = useState(true)
  const [search,  setSearch]    = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [teams,   setTeams]     = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: ps }, { data: ts }, { data: results }] = await Promise.all([
        supabase.from('players').select('id,name,team_id').order('name'),
        supabase.from('teams').select('id,name').order('name'),
        supabase.from('match_results').select('player_id,games'),
      ])

      const teamMap: Record<string, string> = {}
      for (const t of ts ?? []) teamMap[t.id] = t.name
      setTeams(ts ?? [])

      // Aggregate avg per player
      const gameMap: Record<string, number[]> = {}
      for (const r of results ?? []) {
        if (!r.player_id) continue
        const valid = (r.games as number[]).filter(g => g > 0)
        if (!gameMap[r.player_id]) gameMap[r.player_id] = []
        gameMap[r.player_id].push(...valid)
      }

      setPlayers((ps ?? []).map(p => {
        const games = gameMap[p.id]
        const avg   = games?.length ? Math.round(games.reduce((a, b) => a + b, 0) / games.length) : null
        return {
          id: p.id, name: p.name,
          teamId:   p.team_id,
          teamName: teamMap[p.team_id ?? ''] ?? '—',
          avg,
          bitsStatus: null,  // TODO: wire BITS license check
        }
      }))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = players.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchesTeam   = !teamFilter || p.teamId === teamFilter
    return matchesSearch && matchesTeam
  })

  // Group by first letter
  const grouped = filtered.reduce((acc, p) => {
    const letter = p.name[0]?.toUpperCase() ?? '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(p)
    return acc
  }, {} as Record<string, Player[]>)

  const inp: React.CSSProperties = {
    background: C.surface, border: '1px solid ' + C.border, borderRadius: 8,
    padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none',
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 4,
            color: C.textMuted, textDecoration: 'none', fontSize: 13 }}>
            <ChevronLeft size={16} />Admin
          </Link>
          <span style={{ color: C.border }}>/</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Spelare</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.textMuted }}>
            {filtered.length} st
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Sök namn…" style={{ ...inp, flex: 1 }} />
          <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
            style={{ ...inp, flexShrink: 0 }}>
            <option value="">Alla lag</option>
            {teams.map(t => <option key={t.id} value={t.id}>{shortName(t.name)}</option>)}
          </select>
        </div>

        {/* BITS note */}
        <div style={{ background: C.surface, border: '1px solid ' + C.border, borderRadius: 10,
          padding: '10px 14px', marginBottom: 20, fontSize: 12, color: C.textMuted,
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          BITS-licenskolumnen kräver spelarsynk mot SvBF BITS. Visas som — tills dess.
        </div>

        {loading && (
          <div style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Laddar…</div>
        )}

        {/* Player list */}
        {!loading && Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'sv')).map(([letter, group]) => (
          <div key={letter}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.textMuted,
              padding: '12px 0 4px', borderBottom: '1px solid ' + C.border }}>
              {letter}
            </div>
            {group.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 0', borderBottom: '1px solid ' + C.border }}>

                {/* Name + team */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{p.teamName}</div>
                </div>

                {/* Avg */}
                <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, minWidth: 32, textAlign: 'right' }}>
                  {p.avg ?? '—'}
                </div>

                {/* BITS status */}
                <div style={{ minWidth: 64, textAlign: 'center' }}>
                  {p.bitsStatus === 'verified'
                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#5dcaa5' }}>✓ BITS</span>
                    : p.bitsStatus === 'unverified'
                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#e05555' }}>✗ BITS</span>
                    : <span style={{ fontSize: 11, color: C.textMuted }}>—</span>
                  }
                </div>

                {/* Link to profile */}
                <Link href={`/players/${p.id}`} style={{ color: C.textMuted, display: 'flex' }}>
                  <ExternalLink size={14} />
                </Link>
                <ChevronRight size={14} color={C.textMuted} />
              </div>
            ))}
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: C.textMuted, paddingTop: 40, fontSize: 14 }}>
            Inga spelare matchar filtret.
          </div>
        )}

      </div>
    </main>
  )
}
