'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const bg = '#10161e'
const surface = '#172030'
const card = '#1c2840'
const border = '#2a3858'
const accent = '#f5c200'
const textMuted = '#6b7a99'

type Result = {
  team_id: string
  games: number[]
  teams: { name: string; id: string }
}

type TeamStats = {
  id: string
  name: string
  played: number
  totalPins: number
  avg: number
  high: number
  series: number
}

export default function LeaguePage() {
  const [standings, setStandings] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('match_results')
      .select('team_id, games, teams(id, name)')
      .eq('type', 'league')
      .then(({ data }) => {
        if (!data) return setLoading(false)

        const teamMap: Record<string, TeamStats> = {}

        data.forEach((r: Result) => {
          const team = r.teams
          if (!team) return
          if (!teamMap[r.team_id]) {
            teamMap[r.team_id] = {
              id: r.team_id,
              name: team.name,
              played: 0,
              totalPins: 0,
              avg: 0,
              high: 0,
              series: 0,
            }
          }
          const t = teamMap[r.team_id]
          const games = r.games || []
          const seriesTotal = games.reduce((a, b) => a + b, 0)
          t.played += 1
          t.totalPins += seriesTotal
          t.series += 1
          games.forEach(g => { if (g > t.high) t.high = g })
        })

        const list = Object.values(teamMap).map(t => ({
          ...t,
          avg: t.series > 0 ? Math.round((t.totalPins / (t.series * 4)) * 10) / 10 : 0,
        })).sort((a, b) => b.totalPins - a.totalPins)

        setStandings(list)
        setLoading(false)
      })
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Serietabell</h1>
          <span style={{ fontSize: 12, color: textMuted }}>{standings.length} lag</span>
        </div>

        {loading && (
          <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 32, textAlign: 'center', color: textMuted }}>
            Laddar...
          </div>
        )}

        {!loading && standings.length === 0 && (
          <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 32, textAlign: 'center', color: textMuted, fontSize: 13 }}>
            Inga seriematchresultat annu. Lagg till via Admin.
          </div>
        )}

        {!loading && standings.length > 0 && (
          <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 60px 60px 60px 80px', gap: 8, padding: '10px 16px', background: surface, borderBottom: '1px solid ' + border, fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 1 }}>
              <div>#</div>
              <div>LAG</div>
              <div style={{ textAlign: 'right' }}>SERIER</div>
              <div style={{ textAlign: 'right' }}>SNITT</div>
              <div style={{ textAlign: 'right' }}>HOGST</div>
              <div style={{ textAlign: 'right' }}>TOTALT</div>
            </div>

            {standings.map((team, i) => {
              const hue = team.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const tc = 'hsl(' + hue + ',50%,55%)'
              return (
                <a key={team.id} href={'/teams/' + team.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 60px 60px 60px 80px',
                  gap: 8,
                  padding: '13px 16px',
                  borderBottom: i < standings.length - 1 ? '1px solid ' + border : 'none',
                  borderLeft: '3px solid ' + (i === 0 ? accent : i === 1 ? '#9aaabb' : i === 2 ? '#bf8b5e' : 'transparent'),
                  textDecoration: 'none',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = surface)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontWeight: 900, fontSize: i < 3 ? 16 : 13, color: i === 0 ? accent : i === 1 ? '#9aaabb' : i === 2 ? '#bf8b5e' : textMuted }}>
                    {i + 1}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'hsl(' + hue + ',40%,15%)', border: '1px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: tc, flexShrink: 0 }}>
                      {team.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{team.name}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: textMuted }}>{team.series}</div>
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: 'white' }}>{team.avg}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: textMuted }}>{team.high}</div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: accent }}>{team.totalPins.toLocaleString('sv-SE')}</div>
                </a>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 11, color: textMuted, textAlign: 'right' }}>
          Sorterat pa totala pins fran seriematcher
        </div>
      </div>
    </main>
  )
}
