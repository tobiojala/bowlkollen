'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { ChevronRight, Users } from 'lucide-react'
import { shortName } from '@/lib/utils'

type Player = { id: string; name: string; team_id: string; teamName?: string }

export default function PlayersPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: ps } = await supabase.from('players').select('id, name, team_id').order('name')
      const { data: ts } = await supabase.from('teams').select('id, name')
      const teamMap: Record<string, string> = {}
      if (ts) ts.forEach((t: any) => { teamMap[t.id] = t.name })
      if (ps) setPlayers(ps.map((p: any) => ({ ...p, teamName: teamMap[p.team_id] || '' })))
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

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {!loading && players.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Users size={32} color={C.textMuted} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Inga spelare registrerade</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Spelare laggs till via live scoring i Admin</div>
          </div>
        )}

        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'sv')).map(([letter, letterPlayers]) => (
          <div key={letter}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2, padding: '12px 16px 4px', borderBottom: '1px solid ' + C.border }}>
              {letter}
            </div>
            {letterPlayers.map(p => {
              const hue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const tc = 'hsl(' + hue + ',50%,45%)'
              const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
              return (
                <a key={p.id} href={'/players/' + p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
                    {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{p.name}</div>
                    {p.teamName && <div style={{ fontSize: 11, color: C.textMuted }}>{shortName(p.teamName)}</div>}
                  </div>
                  <ChevronRight size={16} color={C.textMuted} />
                </a>
              )
            })}
          </div>
        ))}
      </div>
    </main>
  )
}
