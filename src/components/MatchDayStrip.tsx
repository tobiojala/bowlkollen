'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Match = {
  id: string
  date: string
  status: string
  home_score: number | null
  away_score: number | null
  home: { name: string }
  away: { name: string }
}

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
}

function initials(name: string) {
  return shortName(name).split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()
}

export default function MatchDayStrip() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [matches, setMatches] = useState<Match[]>([])
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const dateScrollRef = useRef<HTMLDivElement>(null)
  const activeDateRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const to = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('matches')
      .select('id, date, status, home_score, away_score, home:teams!home_team_id(name), away:teams!away_team_id(name)')
      .gte('date', from)
      .lte('date', to)
      .not('round', 'is', null)
      .order('date')
      .then(({ data }) => {
        if (data) {
          setMatches(data as unknown as Match[])
          const today = new Date().toISOString().slice(0, 10)
          const dates = [...new Set((data as Match[]).map(m => m.date.slice(0, 10)))].sort()
          const upcoming = dates.find(d => d >= today)
          const past = dates.filter(d => d < today)
          setActiveDate(upcoming || past[past.length - 1] || null)
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (activeDateRef.current && dateScrollRef.current) {
      setTimeout(() => {
        const el = activeDateRef.current
        const container = dateScrollRef.current
        if (el && container) {
          container.scrollTo({ left: el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
        }
      }, 100)
    }
  }, [activeDate, loading])

  if (loading || matches.length === 0) return null

  const today = new Date().toISOString().slice(0, 10)
  const dates = [...new Set(matches.map(m => m.date.slice(0, 10)))].sort()
  const activeMatches = activeDate ? matches.filter(m => m.date.slice(0, 10) === activeDate) : []
  const surface = theme === 'dark' ? '#0f1520' : '#f0f2f5'
  const stripBorder = theme === 'dark' ? '#1e2a3a' : '#e0e4ed'

  return (
    <div style={{ background: surface, borderBottom: '1px solid ' + stripBorder, marginBottom: 32 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>

        {/* Date pills */}
        <div ref={dateScrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', borderBottom: '1px solid ' + stripBorder }}>
          {dates.map(dateKey => {
            const d = new Date(dateKey + 'T12:00:00')
            const days = ['Son','Man','Tis','Ons','Tor','Fre','Lor']
            const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
            const isActive = dateKey === activeDate
            const isToday = dateKey === today
            const isPast = dateKey < today
            return (
              <button
                key={dateKey}
                ref={isActive ? activeDateRef : null}
                onClick={() => setActiveDate(dateKey)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 14px', border: 'none', borderBottom: isActive ? '2px solid #f5c200' : '2px solid transparent', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', opacity: isPast && !isActive ? 0.5 : 1, marginBottom: -1 }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: isActive ? '#f5c200' : C.textMuted, letterSpacing: 0.5 }}>
                  {isToday ? 'IDAG' : days[d.getDay()].toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: isActive ? 800 : 500, color: isActive ? '#f5c200' : C.text }}>
                  {d.getDate()} {months[d.getMonth()]}
                </div>
              </button>
            )
          })}
        </div>

        {/* Match cards */}
        {activeMatches.length > 0 && (
          <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 8, padding: '8px 0', alignItems: 'center' }}>
            {activeMatches.map(m => {
              const isCompleted = m.status === 'completed' || m.home_score !== null
              const isLive = m.status === 'live'
              const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
              const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
              const homeHue = (m.home?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const awayHue = (m.away?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const tc = (hue: number) => 'hsl(' + hue + ',50%,45%)'
              const tclo = (hue: number) => theme === 'dark' ? 'hsl(' + hue + ',40%,18%)' : 'hsl(' + hue + ',40%,92%)'
              return (
                <a key={m.id} href={'/matches/' + m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: theme === 'dark' ? '#172030' : '#ffffff', borderRadius: 10, border: '1px solid ' + (isLive ? '#e05555' : stripBorder), textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: tclo(homeHue), border: '1.5px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: tc(homeHue), flexShrink: 0 }}>
                      {initials(m.home?.name || '')}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: homeWin ? 700 : 400, color: homeWin ? C.text : C.textMuted, whiteSpace: 'nowrap' }}>{shortName(m.home?.name || '')}</span>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 36 }}>
                    {isLive && <div style={{ fontSize: 8, color: '#e05555', fontWeight: 800 }}>LIVE</div>}
                    {isCompleted && m.home_score !== null ? (
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: homeWin ? C.accent : C.textMuted }}>{m.home_score}</span>
                        <span style={{ fontSize: 10, color: C.textMuted }}>-</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: awayWin ? C.accent : C.textMuted }}>{m.away_score}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: C.textMuted }}>vs</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: awayWin ? 700 : 400, color: awayWin ? C.text : C.textMuted, whiteSpace: 'nowrap' }}>{shortName(m.away?.name || '')}</span>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: tclo(awayHue), border: '1.5px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: tc(awayHue), flexShrink: 0 }}>
                      {initials(m.away?.name || '')}
                    </div>
                  </div>
                </a>
              )
            })}
            <a href="/schema" style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none', padding: '6px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Alla matcher &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
