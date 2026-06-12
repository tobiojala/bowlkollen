'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useColors } from '@/components/ThemeProvider'
import { ChevronRight, Users } from 'lucide-react'
import { shortName } from '@/lib/utils'
import { prefetchPlayer } from '@/lib/prefetch'
import { calcRating, getTier } from '@/lib/player-stats'
import type { TierInfo } from '@/lib/types'

type Player = {
  id: string; name: string; team_id: string; teamName?: string
  avg?: number; tier?: TierInfo
}

// Compact tier chip — single letter to keep the row tight
function TierChip({ tier }: { tier: TierInfo }) {
  const letter = tier.label[0]   // L, E, P, V, R
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: '2px 6px',
      borderRadius: 6, border: `1px solid ${tier.border}`,
      background: tier.bg, color: tier.accent, flexShrink: 0,
    }}>
      {letter}
    </span>
  )
}

export default function PlayersPage() {
  const { C, isDark } = useColors()
  const [players, setPlayers]  = useState<Player[]>([])
  const [loading, setLoading]  = useState(true)
  const qc      = useQueryClient()
  const pending = useRef<Record<string, boolean>>({})

  const firePlayer = useCallback((id: string) => {
    if (pending.current[id]) return
    pending.current[id] = true
    prefetchPlayer(qc, id).finally(() => { pending.current[id] = false })
  }, [qc])

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const [{ data: ps }, { data: ts }] = await Promise.all([
        supabase.from('players').select('id,name,team_id').order('name'),
        supabase.from('teams').select('id,name'),
      ])

      const teamMap: Record<string, string> = {}
      ts?.forEach((t: { id: string; name: string }) => { teamMap[t.id] = t.name })

      const base: Player[] = (ps ?? []).map((p: { id: string; name: string; team_id: string }) => ({
        ...p, teamName: teamMap[p.team_id] || '',
      }))
      setPlayers(base)

      // Fetch stats for all players in one query
      const pIds = base.map(p => p.id)
      if (pIds.length > 0) {
        const { data: results } = await supabase
          .from('match_results')
          .select('player_id,games')
          .in('player_id', pIds)

        if (results) {
          const grouped: Record<string, number[]> = {}
          results.forEach((r: { player_id: string; games: number[] }) => {
            const valid = (r.games || []).filter(g => g > 0)
            if (!grouped[r.player_id]) grouped[r.player_id] = []
            grouped[r.player_id].push(...valid)
          })

          setPlayers(prev => prev.map(p => {
            const games = grouped[p.id]
            if (!games || games.length === 0) return p
            const avg    = Math.round(games.reduce((a, b) => a + b) / games.length)
            const over200 = games.filter(g => g >= 200).length
            const best    = Math.max(...games)
            const rating  = calcRating(avg, best, over200, true)
            return { ...p, avg, tier: getTier(rating) }
          }))
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  const grouped = players.reduce((acc, p) => {
    const letter = p.name[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(p)
    return acc
  }, {} as Record<string, Player[]>)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ height: 12, width: `${50 + (i % 3) * 12}%`, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }} />
              <div style={{ height: 9, width: '30%', borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {players.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Users size={32} color={C.muted} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Inga spelare registrerade</div>
            <div style={{ fontSize: 13, color: C.muted }}>Spelare läggs till via live scoring i Admin</div>
          </div>
        )}

        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'sv')).map(([letter, letterPlayers]) => (
          <div key={letter}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 2,
              padding: '12px 16px 4px', borderBottom: `1px solid ${C.border}`,
            }}>
              {letter}
            </div>
            {letterPlayers.map(p => {
              const hue  = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const tc   = `hsl(${hue},50%,45%)`
              const tclo = isDark ? `hsl(${hue},40%,15%)` : `hsl(${hue},40%,92%)`
              return (
                <a key={p.id} href={'/players/' + p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}
                  onMouseEnter={e => { firePlayer(p.id); e.currentTarget.style.background = C.card }}
                  onTouchStart={() => firePlayer(p.id)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Avatar */}
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: tclo, border: `1.5px solid ${tc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
                    {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Name + team */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{p.name}</div>
                    {p.teamName && <div style={{ fontSize: 11, color: C.muted }}>{shortName(p.teamName)}</div>}
                  </div>

                  {/* Stats: avg + tier */}
                  {p.avg && p.tier && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <TierChip tier={p.tier} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: C.accent, minWidth: 28, textAlign: 'right' }}>
                        {p.avg}
                      </span>
                    </div>
                  )}

                  <ChevronRight size={14} color={C.muted} style={{ flexShrink: 0 }} />
                </a>
              )
            })}
          </div>
        ))}
      </div>
    </main>
  )
}
