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
  home_team_id: string
  away_team_id: string
  home: Team
  away: Team
}

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').trim()
}

function teamCode(name: string) {
  const s = shortName(name)
  const words = s.split(' ')
  if (words.length === 1) return s.slice(0, 3).toUpperCase()
  if (words.length === 2) return (words[0][0] + words[1].slice(0, 2)).toUpperCase()
  return words.map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

function parseDate(dateStr: string) {
  const d = new Date(dateStr)
  const days = ['Son','Man','Tis','Ons','Tor','Fre','Lor']
  const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
  return {
    day: days[d.getDay()],
    date: d.getDate(),
    month: months[d.getMonth()],
    dateKey: dateStr.slice(0, 10),
  }
}

export default function SchedulePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

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
          const now = new Date()
          const today = now.toISOString().slice(0, 10)
          const all = data as any[]
          const dates = [...new Set(all.map((m: any) => m.date.slice(0, 10)))].sort()
          const pastDates = dates.filter(d => d < today)
          const futureDates = dates.filter(d => d >= today)
          const target = futureDates[0] || pastDates[pastDates.length - 1] || dates[0]
          setActiveDate(target)
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (activeDate && dateRefs.current[activeDate] && scrollRef.current) {
      setTimeout(() => {
        const el = dateRefs.current[activeDate]
        const container = scrollRef.current
        if (el && container) {
          container.scrollTo({ left: el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
        }
      }, 150)
    }
  }, [activeDate, loading])

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const dates = [...new Set(matches.map(m => m.date.slice(0, 10)))].sort()

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', textAlign: 'center', color: C.textMuted }}>Laddar...</div>
      </main>
    )
  }

  const activeMatches = activeDate
    ? matches.filter(m => m.date.slice(0, 10) === activeDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : []

  const isPast = (d: string) => d < today
  const isToday = (d: string) => d === today
  const isFuture = (d: string) => d > today

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 4 }}>Schema</h1>
            <div style={{ fontSize: 13, color: C.textMuted }}>Elitserien Herrar 2025/2026 &middot; {dates.length} speldagar</div>
          </div>
          <a href="https://bits.swebowl.se/elitserien-herrar" target="_blank" rel="noopener noreferrer" style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '7px 14px', fontSize: 12, color: C.textMuted, textDecoration: 'none', fontWeight: 600 }}>
            BITS &#8599;
          </a>
        </div>
      </div>

      {/* Date scroller */}
      <div ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: 5, padding: '0 24px', width: 'max-content' }}>
          {dates.map(dateKey => {
            const d = parseDate(dateKey + 'T12:00:00')
            const isActive = dateKey === activeDate
            const past = isPast(dateKey)
            const today2 = isToday(dateKey)
            const dayMatches = matches.filter(m => m.date.slice(0, 10) === dateKey)
            const round = dayMatches[0]?.round

            return (
              <div
                key={dateKey}
                ref={el => { dateRefs.current[dateKey] = el }}
                onClick={() => setActiveDate(dateKey)}
                style={{
                  minWidth: 52,
                  padding: '8px 6px 6px',
                  borderRadius: 10,
                  border: '2px solid ' + (isActive ? C.accent : today2 ? C.green : C.border),
                  background: isActive
                    ? (theme === 'dark' ? 'rgba(245,194,0,0.1)' : 'rgba(10,92,138,0.06)')
                    : past ? C.surface : C.card,
                  cursor: 'pointer',
                  textAlign: 'center',
                  opacity: past && !isActive ? 0.55 : 1,
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 600, color: isActive ? C.accent : C.textMuted, marginBottom: 2, letterSpacing: 0.3 }}>{d.day}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: isActive ? C.accent : C.text, lineHeight: 1 }}>{d.date}</div>
                <div style={{ fontSize: 9, color: isActive ? C.accent : C.textMuted, marginTop: 1 }}>{d.month}</div>
                <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2, opacity: 0.7 }}>O{round}</div>
                {today2 && !isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.green, margin: '3px auto 0' }} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active day matches */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 24px 60px' }}>
        {activeDate && activeMatches.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              {(() => {
                const d = parseDate(activeDate + 'T12:00:00')
                return <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{d.day} {d.date} {d.month}</div>
              })()}
              <div style={{ fontSize: 12, color: C.textMuted }}>Omgang {activeMatches[0]?.round}</div>
              {isToday(activeDate) && (
                <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: theme === 'dark' ? 'rgba(46,170,110,0.1)' : 'rgba(46,170,110,0.08)', borderRadius: 20, padding: '2px 8px', border: '1px solid ' + C.green + '44' }}>IDAG</span>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button
                  onClick={() => { const i = dates.indexOf(activeDate); if (i > 0) setActiveDate(dates[i-1]) }}
                  style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '5px 12px', fontSize: 14, color: C.textMuted, cursor: 'pointer' }}
                >&#8592;</button>
                <button
                  onClick={() => { const i = dates.indexOf(activeDate); if (i < dates.length-1) setActiveDate(dates[i+1]) }}
                  style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '5px 12px', fontSize: 14, color: C.textMuted, cursor: 'pointer' }}
                >&#8594;</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeMatches.map(m => {
                const isCompleted = new Date(m.date) < now
                const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
                const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
                const isDraw = m.home_score !== null && m.home_score === m.away_score
                const homeHue = (m.home?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const awayHue = (m.away?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const tc = (hue: number) => 'hsl(' + hue + ',50%,45%)'
                const tclo = (hue: number) => theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

                return (
                  <a key={m.id} href={'/matches/' + m.id} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, textDecoration: 'none', display: 'block' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 8, padding: '14px 16px', alignItems: 'center' }}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: homeWin ? 800 : 500, color: homeWin ? C.text : C.textMuted }}>{shortName(m.home?.name || '')}</div>
                          {m.venue && <div style={{ fontSize: 10, color: C.textMuted, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.venue}</div>}
                        </div>
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: tclo(homeHue), border: '2px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: tc(homeHue), flexShrink: 0 }}>
                          {teamCode(m.home?.name || '')}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        {isCompleted && m.home_score !== null ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                              <span style={{ fontSize: 22, fontWeight: 900, color: homeWin ? C.accent : isDraw ? C.text : C.textMuted, lineHeight: 1 }}>{m.home_score}</span>
                              <span style={{ fontSize: 11, color: C.textMuted }}>-</span>
                              <span style={{ fontSize: 22, fontWeight: 900, color: awayWin ? C.accent : isDraw ? C.text : C.textMuted, lineHeight: 1 }}>{m.away_score}</span>
                            </div>
                            <div style={{ fontSize: 8, color: C.textMuted, letterSpacing: 0.5, marginTop: 2 }}>MATCHPOANG</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 16, fontWeight: 700, color: C.textMuted }}>vs</div>
                            {m.stream_url && (
                              <a href={m.stream_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: '#e05555', fontWeight: 800, textDecoration: 'none' }}>SCORING</a>
                            )}
                          </>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: tclo(awayHue), border: '2px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: tc(awayHue), flexShrink: 0 }}>
                          {teamCode(m.away?.name || '')}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: awayWin ? 800 : 500, color: awayWin ? C.text : C.textMuted }}>{shortName(m.away?.name || '')}</div>
                          {m.oil_profile && <div style={{ fontSize: 10, color: C.textMuted }}>{m.oil_profile}</div>}
                        </div>
                      </div>

                    </div>
                  </a>
                )
              })}
            </div>

            <div style={{ marginTop: 14, padding: '10px 14px', background: C.card, borderRadius: 10, border: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>Fullstandig statistik pa BITS</div>
              <a href="https://bits.swebowl.se/elitserien-herrar" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Elitserien BITS &#8599;</a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
