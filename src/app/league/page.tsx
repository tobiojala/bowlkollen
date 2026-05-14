'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Result = { team_id: string; games: number[]; teams: any }
type TeamStats = { id: string; name: string; series: number; totalPins: number; avg: number; high: number }

export default function LeaguePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [standings, setStandings] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('match_results').select('team_id, games, teams(id, name)').eq('type', 'league').then(({ data }) => {
      if (!data) return setLoading(false)
      const map: Record<string, TeamStats> = {}
      data.forEach((r: Result) => {
        const team = r.teams
        if (!team) return
        if (!map[r.team_id]) map[r.team_id] = { id: r.team_id, name: team.name, series: 0, totalPins: 0, avg: 0, high: 0 }
        const t = map[r.team_id]
        const games = r.games || []
        t.series += 1
        t.totalPins += games.reduce((a, b) => a + b, 0)
        games.forEach(g => { if (g > t.high) t.high = g })
      })
      const list = Object.values(map).map(t => ({ ...t, avg: t.series > 0 ? Math.round((t.totalPins / (t.series * 4)) * 10) / 10 : 0 })).sort((a, b) => b.totalPins - a.totalPins)
      setStandings(list)
      setLoading(false)
    })
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Serietabell</h1>
          <span style={{ fontSize: 12, color: C.textMuted }}>{standings.length} lag</span>
        </div>

        {loading && <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted }}>Laddar...</div>}

        {!loading && standings.length === 0 && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga seriematchresultat annu
          </div>
        )}

        {!loading && standings.length > 0 && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 60px 60px 60px 80px', gap: 8, padding: '10px 16px', background: C.surface, borderBottom: '1px solid ' + C.border, fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}>
              <div>#</div><div>LAG</div>
              <div style={{ textAlign: 'right' }}>SERIER</div>
              <div style={{ textAlign: 'right' }}>SNITT</div>
              <div style={{ textAlign: 'right' }}>HOGST</div>
              <div style={{ textAlign: 'right' }}>TOTALT</div>
            </div>
            {standings.map((team, i) => {
              const hue = team.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const tc = 'hsl(' + hue + ',50%,45%)'
              return (
                <a key={team.id} href={'/teams/' + team.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 60px 60px 60px 80px', gap: 8, padding: '13px 16px', borderBottom: i < standings.length - 1 ? '1px solid ' + C.border : 'none', borderLeft: '3px solid ' + (i === 0 ? C.accent : i === 1 ? '#9aaabb' : i === 2 ? '#bf8b5e' : 'transparent'), textDecoration: 'none', alignItems: 'center', background: C.card }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                  onMouseLeave={e => (e.currentTarget.style.background = C.card)}
                >
                  <div style={{ fontWeight: 900, fontSize: i < 3 ? 16 : 13, color: i === 0 ? C.accent : i === 1 ? '#9aaabb' : i === 2 ? '#bf8b5e' : C.textMuted }}>{i + 1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)', border: '1px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: tc, flexShrink: 0 }}>
                      {team.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{team.name}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: C.textMuted }}>{team.series}</div>
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: C.text }}>{team.avg}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: C.textMuted }}>{team.high}</div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: C.accent }}>{team.totalPins.toLocaleString('sv-SE')}</div>
                </a>
              )
            })}
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 11, color: C.textMuted, textAlign: 'right' }}>Sorterat pa totala pins fran seriematcher</div>
      </div>
    </main>
  )
}
