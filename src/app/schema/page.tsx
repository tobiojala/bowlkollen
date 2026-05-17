'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Team = { id: string; name: string }
type Match = {
  id: string
  date: string
  status: string
  round: number
  home_score: number | null
  away_score: number | null
  venue: string
  oil_profile: string
  stream_url: string
  division: string
  home_team_id: string
  away_team_id: string
  home: Team
  away: Team
}

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
}

export default function SchedulePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeDateRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select('*, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
      .not('round', 'is', null)
      .order('date')
      .then(({ data }) => {
        if (data) {
          setMatches(data as unknown as Match[])
          const now = new Date().toISOString().slice(0, 10)
          const allDates = [...new Set((data as any[]).map((m: any) => m.date.slice(0, 10)))].sort()

          // Check URL param
          const params = new URLSearchParams(window.location.search)
          const dateParam = params.get('date')
          if (dateParam && allDates.includes(dateParam)) {
            setActiveDate(dateParam)
          } else {
            const upcoming = allDates.find(d => d >= now)
            const past = allDates.filter(d => d < now)
            setActiveDate(upcoming || past[past.length - 1] || allDates[0])
          }
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (activeDateRef.current && scrollRef.current) {
      setTimeout(() => {
        const el = activeDateRef.current!
        const container = scrollRef.current!
        container.scrollTo({ left: el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
      }, 150)
    }
  }, [activeDate, loading])

  const now = new Date().toISOString().slice(0, 10)
  const dates = [...new Set(matches.map(m => m.date.slice(0, 10)))].sort()
  const days = ['Sön','Mån','Tis','Ons','Tor','Fre','Lör']
  const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']

  const activeMatches = activeDate
    ? matches.filter(m => m.date.slice(0, 10) === activeDate)
    : []

  const divisions = [...new Set(activeMatches.map(m => m.division || 'Ovrigt'))]

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted }}>Laddar...</div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Date strip — same as home page */}
      <div style={{ borderBottom: '1px solid ' + C.border, position: 'sticky', top: 56, background: C.bg, zIndex: 30 }}>
        <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex' }}>
          {dates.map(dateKey => {
            const d = new Date(dateKey + 'T12:00:00')
            const isActive = dateKey === activeDate
            const isToday = dateKey === now
            const isPast = dateKey < now
            return (
              <button
                key={dateKey}
                ref={isActive ? activeDateRef : null}
                onClick={() => setActiveDate(dateKey)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: '2px solid ' + (isActive ? '#f5c200' : 'transparent'),
                  background: 'transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: isPast && !isActive ? 0.35 : 1,
                  gap: 1,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: isActive ? '#f5c200' : C.textMuted }}>
                  {isToday ? 'IDAG' : days[d.getDay()].toUpperCase()}
                </span>
                <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 400, color: isActive ? '#f5c200' : C.text }}>
                  {d.getDate()} {months[d.getMonth()]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Match list */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {activeDate && divisions.map(div => {
          const divMatches = activeMatches.filter(m => (m.division || 'Ovrigt') === div)
          return (
            <div key={div}>
              {/* Division header */}
              <div style={{ padding: '16px 20px 8px', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2 }}>
                {div.toUpperCase()}
              </div>

              {divMatches.map(m => {
                const isCompleted = m.home_score !== null
                const isLive = m.status === 'live'
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
                      <span style={{ fontSize: 14, fontWeight: homeWin ? 700 : 400, color: homeWin ? C.text : C.textMuted, textAlign: 'right', lineHeight: 1.2 }}>
                        {shortName(m.home?.name || '')}
                      </span>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: tclo(homeHue), border: '1.5px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: tc(homeHue), flexShrink: 0 }}>
                        {shortName(m.home?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'center', minWidth: 56 }}>
                      {isLive && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />
                          <span style={{ fontSize: 8, fontWeight: 800, color: '#e05555', letterSpacing: 1 }}>LIVE</span>
                        </div>
                      )}
                      {isCompleted ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: homeWin ? C.accent : C.textMuted, lineHeight: 1 }}>{m.home_score}</span>
                            <span style={{ fontSize: 11, color: C.textMuted }}>-</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: awayWin ? C.accent : C.textMuted, lineHeight: 1 }}>{m.away_score}</span>
                          </div>
                          <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2, letterSpacing: 0.5 }}>MP</div>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>vs</span>
                      )}
                    </div>

                    {/* Away */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: tclo(awayHue), border: '1.5px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: tc(awayHue), flexShrink: 0 }}>
                        {shortName(m.away?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: awayWin ? 700 : 400, color: awayWin ? C.text : C.textMuted, lineHeight: 1.2 }}>
                        {shortName(m.away?.name || '')}
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          )
        })}

        {activeMatches.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga matcher den har dagen
          </div>
        )}

        <div style={{ padding: '16px 20px' }}>
          <a href="https://bits.swebowl.se/elitserien-herrar" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none' }}>
            Fullstandig info pa BITS &#8599;
          </a>
        </div>
      </div>
    </main>
  )
}
