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
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

const DIVISION_TIERS: Record<string, number> = {
  'Elitserien Herrar': 1, 'Elitserien Damer': 1,
  'SM-slutspel Herrar': 1, 'SM-slutspel Damer': 1,
  'Mellanallsvenskan Herrar': 2, 'Nordallsvenskan Herrar': 2,
  'Sydallsvenskan Herrar': 2, 'Norra Allsvenskan Herrar': 2,
  'Södra Allsvenskan Herrar': 2,
}

function getTier(division: string): number {
  return DIVISION_TIERS[division] || 3
}

function getDivColor(division: string): string {
  if (division.includes('Elitserien') && division.includes('Herrar')) return '#4a90d9'
  if (division.includes('Elitserien') && division.includes('Damer')) return '#d94a90'
  if (division.includes('SM')) return '#f5c200'
  if (getTier(division) === 2) return '#5ba85a'
  return '#8a7a5a'
}

function shortDiv(division: string): string {
  return division
    .replace('Elitserien ', 'Elitserien ')
    .replace('Allsvenskan', 'Allsv.')
    .replace('Mellanallsvenskan', 'Mellanallsv.')
    .replace(' Herrar', ' H')
    .replace(' Damer', ' D')
    .replace('Div 1 ', 'D1 ')
    .replace('Norra ', 'N.')
    .replace('Södra ', 'S.')
    .replace('Götaland', 'Götal.')
    .replace('Norrland', 'Norrl.')
    .replace('Svealand', 'Sveal.')
}

export default function SchedulePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'elite' | 'allsvenskan' | 'div1'>('all')
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
          const params = new URLSearchParams(window.location.search)
          const dateParam = params.get('date')
          if (dateParam && allDates.includes(dateParam)) setActiveDate(dateParam)
          else {
            const upcoming = allDates.find(d => d >= now)
            setActiveDate(upcoming || allDates[allDates.length - 1] || null)
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
  const days = ['Sön','Mån','Tis','Ons','Tor','Fre','Lör']
  const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
  const dates = [...new Set(matches.map(m => m.date.slice(0, 10)))].sort()

  const filterMatches = (ms: Match[]) => {
    if (filter === 'elite') return ms.filter(m => getTier(m.division) === 1)
    if (filter === 'allsvenskan') return ms.filter(m => getTier(m.division) === 2)
    if (filter === 'div1') return ms.filter(m => getTier(m.division) === 3)
    return ms
  }

  const activeMatches = activeDate
    ? filterMatches(matches.filter(m => m.date.slice(0, 10) === activeDate))
      .sort((a, b) => getTier(a.division) - getTier(b.division))
    : []

  const divisions = [...new Set(activeMatches.map(m => m.division))]
    .sort((a, b) => getTier(a) - getTier(b))

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted }}>Laddar...</div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Date strip */}
      <div style={{ borderBottom: '1px solid ' + C.border, position: 'sticky', top: 56, background: C.bg, zIndex: 30 }}>
        <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex' }}>
          {dates.map(dateKey => {
            const d = new Date(dateKey + 'T12:00:00')
            const isActive = dateKey === activeDate
            const isToday = dateKey === now
            const isPast = dateKey < now
            return (
              <button key={dateKey} ref={isActive ? activeDateRef : null} onClick={() => setActiveDate(dateKey)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', border: 'none', borderBottom: '2px solid ' + (isActive ? '#f5c200' : 'transparent'), background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', opacity: isPast && !isActive ? 0.35 : 1, gap: 1, WebkitTapHighlightColor: 'transparent' }}
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

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'all', label: 'Alla' },
            { key: 'elite', label: 'Elitserien' },
            { key: 'allsvenskan', label: 'Allsvenskan' },
            { key: 'div1', label: 'Division 1' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid ' + (filter === f.key ? C.accent : C.border), background: filter === f.key ? C.accent + '18' : 'transparent', color: filter === f.key ? C.accent : C.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matches */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {activeMatches.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga matcher den har dagen
          </div>
        )}

        {divisions.map(div => {
          const divMatches = activeMatches.filter(m => m.division === div)
          const tier = getTier(div)
          const divColor = getDivColor(div)
          const isElite = tier === 1
          const isAllsv = tier === 2

          return (
            <div key={div}>
              {/* Division header */}
              <div style={{ padding: isElite ? '14px 20px 8px' : '12px 20px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: isElite ? 10 : 8, height: isElite ? 10 : 8, borderRadius: 2, background: divColor, flexShrink: 0 }} />
                <div style={{ fontSize: isElite ? 11 : 10, fontWeight: 800, color: divColor, letterSpacing: 1.5 }}>
                  {div.toUpperCase()}
                </div>
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
                const nameSize = isElite ? 15 : isAllsv ? 14 : 13
                const padV = isElite ? '14px' : isAllsv ? '12px' : '10px'

                return (
                  <a key={m.id} href={'/matches/' + m.id}
                    style={{ display: 'flex', alignItems: 'center', padding: padV + ' 20px', borderBottom: '1px solid ' + C.border, textDecoration: 'none', gap: 12, WebkitTapHighlightColor: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Home */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: nameSize, fontWeight: homeWin ? 700 : 400, color: homeWin ? C.text : C.textMuted, lineHeight: 1.2 }}>
                          {shortName(m.home?.name || '')}
                        </div>
                        {isElite && <div style={{ fontSize: 10, color: C.textMuted }}>Hemmalag</div>}
                      </div>
                      <div style={{ width: isElite ? 32 : 26, height: isElite ? 32 : 26, borderRadius: 7, background: tclo(homeHue), border: '1.5px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isElite ? 8 : 7, fontWeight: 800, color: tc(homeHue), flexShrink: 0 }}>
                        {shortName(m.home?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'center', minWidth: isElite ? 60 : 50 }}>
                      {isLive && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />
                          <span style={{ fontSize: 8, fontWeight: 800, color: '#e05555' }}>LIVE</span>
                        </div>
                      )}
                      {isCompleted ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <span style={{ fontSize: isElite ? 20 : 16, fontWeight: 900, color: homeWin ? C.accent : C.textMuted, lineHeight: 1 }}>{m.home_score}</span>
                            <span style={{ fontSize: 11, color: C.textMuted }}>-</span>
                            <span style={{ fontSize: isElite ? 20 : 16, fontWeight: 900, color: awayWin ? C.accent : C.textMuted, lineHeight: 1 }}>{m.away_score}</span>
                          </div>
                          <div style={{ fontSize: 8, color: C.textMuted, letterSpacing: 0.5 }}>MP</div>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: C.textMuted }}>vs</span>
                      )}
                    </div>

                    {/* Away */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: isElite ? 32 : 26, height: isElite ? 32 : 26, borderRadius: 7, background: tclo(awayHue), border: '1.5px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isElite ? 8 : 7, fontWeight: 800, color: tc(awayHue), flexShrink: 0 }}>
                        {shortName(m.away?.name || '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: nameSize, fontWeight: awayWin ? 700 : 400, color: awayWin ? C.text : C.textMuted, lineHeight: 1.2 }}>
                          {shortName(m.away?.name || '')}
                        </div>
                        {isElite && <div style={{ fontSize: 10, color: C.textMuted }}>Bortalag</div>}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )
        })}

        <div style={{ padding: '16px 20px' }}>
          <a href="https://bits.swebowl.se" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none' }}>
            Fullstandig info pa BITS &#8599;
          </a>
        </div>
      </div>
    </main>
  )
}
