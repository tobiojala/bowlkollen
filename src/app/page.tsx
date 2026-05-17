'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import HeroCarousel from '@/components/HeroCarousel'
import MatchDayStrip from '@/components/MatchDayStrip'

type Match = {
  id: string
  date: string
  status: string
  home_score: number | null
  away_score: number | null
  division: string | null
  home: { id: string; name: string }
  away: { id: string; name: string }
}

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
}

export default function Home() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select('id, date, status, home_score, away_score, division, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
      .eq('status', 'completed')
      .not('home_score', 'is', null)
      .order('date', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setMatches(data as unknown as Match[])
        setLoading(false)
      })
  }, [])

  const grouped = matches.reduce((acc, m) => {
    const div = m.division || 'Ovrigt'
    if (!acc[div]) acc[div] = []
    acc[div].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Hero carousel */}
      <div style={{ padding: '16px 16px 0' }}>
        <HeroCarousel />
      </div>

      {/* Match day strip */}
      <MatchDayStrip />

      {/* Latest results */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ padding: '20px 20px 8px', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2 }}>
          SENASTE RESULTAT
        </div>

        {loading && (
          <div style={{ padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Laddar...</div>
        )}

        {!loading && Object.entries(grouped).map(([div, divMatches]) => (
          <div key={div}>
            <div style={{ padding: '12px 20px 6px', fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5 }}>
              {div.toUpperCase()}
            </div>
            {divMatches.slice(0, 5).map(m => {
              const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
              const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
              const homeHue = (m.home?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const awayHue = (m.away?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const tc = (hue: number) => 'hsl(' + hue + ',50%,45%)'
              const tclo = (hue: number) => theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

              return (
                <a key={m.id} href={'/matches/' + m.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid ' + C.border, textDecoration: 'none', gap: 12, WebkitTapHighlightColor: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Home */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: homeWin ? 700 : 400, color: homeWin ? C.text : C.textMuted, lineHeight: 1.2 }}>
                        {shortName(m.home?.name || '')}
                      </div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>Hemmalag</div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: tclo(homeHue), border: '1.5px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: tc(homeHue), flexShrink: 0 }}>
                      {shortName(m.home?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'center', minWidth: 60 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: homeWin ? C.accent : C.textMuted, lineHeight: 1 }}>{m.home_score}</span>
                      <span style={{ fontSize: 12, color: C.textMuted }}>-</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: awayWin ? C.accent : C.textMuted, lineHeight: 1 }}>{m.away_score}</span>
                    </div>
                    <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2, letterSpacing: 0.5 }}>MP</div>
                  </div>

                  {/* Away */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: tclo(awayHue), border: '1.5px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: tc(awayHue), flexShrink: 0 }}>
                      {shortName(m.away?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: awayWin ? 700 : 400, color: awayWin ? C.text : C.textMuted, lineHeight: 1.2 }}>
                        {shortName(m.away?.name || '')}
                      </div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>Bortalag</div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        ))}

        {!loading && matches.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga matcher spelade annu
          </div>
        )}

        <div style={{ padding: '16px 20px' }}>
          <a href="/schema" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>
            Se alla matcher i schema &rarr;
          </a>
        </div>
      </div>
    </main>
  )
}
