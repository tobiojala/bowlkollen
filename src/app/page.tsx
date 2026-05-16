'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import MatchDayStrip from '@/components/MatchDayStrip'
import HeroCarousel from '@/components/HeroCarousel'

type Match = {
  id: string
  date: string
  status: string
  home_score: number | null
  away_score: number | null
  venue: string | null
  home_team_id: string
  away_team_id: string
  home: { id: string; name: string }
  away: { id: string; name: string }
}

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').trim()
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
      .select('id, date, status, home_score, away_score, venue, home_team_id, away_team_id, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
      .eq('status', 'completed')
      .not('home_score', 'is', null)
      .order('date', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setMatches(data as unknown as Match[])
        setLoading(false)
      })
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <HeroCarousel />

        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 2, marginBottom: 16 }}>SENASTE MATCHER</div>

        {loading && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Laddar...
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga matcher spelade annu
          </div>
        )}

        {!loading && matches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matches.map(match => {
              const homeWin = (match.home_score ?? 0) > (match.away_score ?? 0)
              const awayWin = (match.away_score ?? 0) > (match.home_score ?? 0)
              const isDraw = match.home_score !== null && match.home_score === match.away_score
              const homeHue = (match.home?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const awayHue = (match.away?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const tc = (hue: number) => 'hsl(' + hue + ',50%,45%)'
              const tclo = (hue: number) => theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

              return (
                <a key={match.id} href={'/matches/' + match.id} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, textDecoration: 'none', display: 'block', overflow: 'hidden' }}>
                  <div style={{ background: C.surface, padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ' + C.border }}>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{match.date?.slice(0, 10)}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{match.venue || 'Elitserien Herrar'}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 8, padding: '14px 16px', alignItems: 'center' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: homeWin ? 800 : 500, color: homeWin ? C.text : C.textMuted }}>{shortName(match.home?.name || '')}</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>Hemmalag</div>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: tclo(homeHue), border: '2px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: tc(homeHue), flexShrink: 0 }}>
                        {shortName(match.home?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ fontSize: 26, fontWeight: 900, color: homeWin ? C.accent : isDraw ? C.text : C.textMuted, lineHeight: 1 }}>{match.home_score}</span>
                        <span style={{ fontSize: 13, color: C.textMuted }}>-</span>
                        <span style={{ fontSize: 26, fontWeight: 900, color: awayWin ? C.accent : isDraw ? C.text : C.textMuted, lineHeight: 1 }}>{match.away_score}</span>
                      </div>
                      <div style={{ fontSize: 8, color: C.textMuted, letterSpacing: 0.5, marginTop: 2 }}>MATCHPOANG</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: tclo(awayHue), border: '2px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: tc(awayHue), flexShrink: 0 }}>
                        {shortName(match.away?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: awayWin ? 800 : 500, color: awayWin ? C.text : C.textMuted }}>{shortName(match.away?.name || '')}</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>Bortalag</div>
                      </div>
                    </div>

                  </div>
                </a>
              )
            })}

            <a href="/schema" style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none', display: 'block' }}>
              Se alla matcher i schema &rarr;
            </a>
          </div>
        )}

      </div>
    </main>
  )
}
