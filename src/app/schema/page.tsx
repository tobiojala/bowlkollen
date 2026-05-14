'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Team = { id: string; name: string; city: string }
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

function teamInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const days = ['Son', 'Man', 'Tis', 'Ons', 'Tor', 'Fre', 'Lor']
  const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
  return {
    day: days[d.getDay()],
    date: d.getDate(),
    month: months[d.getMonth()],
    time: d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
  }
}

export default function SchedulePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select('*, home:teams!home_team_id(id,name,city), away:teams!away_team_id(id,name,city)')
      .not('round', 'is', null)
      .order('date')
      .then(({ data }) => {
        if (data) {
          setMatches(data as unknown as Match[])
          const now = new Date()
          const completedRounds = (data as any[]).filter(m => new Date(m.date) < now).map((m: any) => m.round as number)
          const upcomingRounds = (data as any[]).filter(m => new Date(m.date) >= now).map((m: any) => m.round as number)
          const latestCompleted = completedRounds.length > 0 ? Math.max(...completedRounds) : null
          const firstUpcoming = upcomingRounds.length > 0 ? Math.min(...upcomingRounds) : null
          const toExpand = new Set<number>()
          if (latestCompleted) toExpand.add(latestCompleted)
          if (firstUpcoming) toExpand.add(firstUpcoming)
          setExpandedRounds(toExpand)
        }
        setLoading(false)
      })
  }, [])

  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b)
  const now = new Date()

  const toggleRound = (r: number) => {
    setExpandedRounds(prev => {
      const next = new Set(prev)
      if (next.has(r)) next.delete(r)
      else next.add(r)
      return next
    })
  }

  const getRoundStatus = (round: number) => {
    const roundMatches = matches.filter(m => m.round === round)
    const dates = roundMatches.map(m => new Date(m.date))
    const latest = new Date(Math.max(...dates.map(d => d.getTime())))
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())))
    if (latest < now) return 'completed'
    if (earliest <= now) return 'live'
    return 'upcoming'
  }

  const surface2 = theme === 'dark' ? '#1a2030' : '#f8f9fb'

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', textAlign: 'center', color: C.textMuted }}>Laddar schema...</div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 4 }}>Schema</h1>
            <div style={{ fontSize: 13, color: C.textMuted }}>Elitserien Herrar 2025/2026 &middot; {rounds.length} omgangar &middot; {matches.length} matcher</div>
          </div>
          <a href="/league" style={{ background: C.accent, color: theme === 'dark' ? '#1a1400' : '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>Serietabell</a>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rounds.map(round => {
            const roundMatches = matches.filter(m => m.round === round).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            const status = getRoundStatus(round)
            const allCompleted = rounds.filter(r => getRoundStatus(r) === 'completed')
            const allUpcoming = rounds.filter(r => getRoundStatus(r) === 'upcoming')
            const isLatest = status === 'completed' && allCompleted.length > 0 && round === Math.max(...allCompleted)
            const isNext = status === 'upcoming' && allUpcoming.length > 0 && round === Math.min(...allUpcoming)
            const isExpanded = expandedRounds.has(round)
            const borderColor = status === 'live' ? C.red : isLatest || isNext ? C.accent : C.border
            const bgColor = isLatest || isNext ? (theme === 'dark' ? 'rgba(245,194,0,0.04)' : 'rgba(10,92,138,0.03)') : C.card

            return (
              <div key={round} style={{ background: bgColor, borderRadius: 12, border: '1px solid ' + borderColor, overflow: 'hidden' }}>

                <div onClick={() => toggleRound(round)} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Omgang {round}</div>
                    {status === 'live' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(224,85,85,0.15)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: 20, padding: '2px 8px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, display: 'inline-block' }} />
                        <span style={{ fontSize: 9, fontWeight: 800, color: C.red, letterSpacing: 1 }}>LIVE</span>
                      </span>
                    )}
                    {isLatest && <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, background: theme === 'dark' ? 'rgba(245,194,0,0.1)' : 'rgba(10,92,138,0.08)', borderRadius: 20, padding: '2px 8px', border: '1px solid ' + C.accent + '44' }}>SENASTE</span>}
                    {isNext && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: theme === 'dark' ? 'rgba(46,170,110,0.1)' : 'rgba(46,170,110,0.08)', borderRadius: 20, padding: '2px 8px', border: '1px solid ' + C.green + '44' }}>NASTA</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 11, color: C.textMuted }}>
                      {formatDate(roundMatches[0].date).date} {formatDate(roundMatches[0].date).month}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{roundMatches.length} matcher</div>
                    <div style={{ color: C.textMuted, fontSize: 12, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>v</div>
                  </div>
                </div>

                {!isExpanded && status === 'completed' && (
                  <div style={{ padding: '0 18px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {roundMatches.map(m => {
                      const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
                      const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
                      return (
                        <a key={m.id} href={'/matches/' + m.id} style={{ background: C.surface, borderRadius: 8, padding: '4px 10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid ' + C.border, fontSize: 11 }}>
                          <span style={{ color: homeWin ? C.accent : C.textMuted, fontWeight: homeWin ? 700 : 400 }}>{teamInitials(m.home?.name || '')}</span>
                          <span style={{ color: C.textMuted, fontSize: 10, fontWeight: 600 }}>{m.home_score}-{m.away_score}</span>
                          <span style={{ color: awayWin ? C.accent : C.textMuted, fontWeight: awayWin ? 700 : 400 }}>{teamInitials(m.away?.name || '')}</span>
                        </a>
                      )
                    })}
                  </div>
                )}

                {isExpanded && (
                  <div style={{ borderTop: '1px solid ' + C.border }}>
                    {roundMatches.map((m, i) => {
                      const d = formatDate(m.date)
                      const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
                      const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
                      const isDraw = m.home_score !== null && m.home_score === m.away_score
                      const isCompleted = new Date(m.date) < now
                      const homeHue = (m.home?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                      const awayHue = (m.away?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                      const tc = (hue: number) => 'hsl(' + hue + ',50%,45%)'
                      const tclo = (hue: number) => 'hsl(' + hue + ',40%,' + (theme === 'dark' ? '15%' : '92%') + ')'
                      return (
                        <a key={m.id} href={'/matches/' + m.id}
                          style={{ display: 'grid', gridTemplateColumns: '70px 1fr 100px 1fr 32px', gap: 8, padding: '12px 18px', borderBottom: i < roundMatches.length - 1 ? '1px solid ' + C.border : 'none', textDecoration: 'none', alignItems: 'center', background: 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = surface2)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: C.textMuted }}>{d.day} {d.date} {d.month}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.time}</div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 13, fontWeight: homeWin ? 800 : 500, color: homeWin ? C.text : C.textMuted, whiteSpace: 'nowrap' }}>{m.home?.name?.replace(' A', '').replace(' H', '') || '?'}</div>
                              {m.venue && <div style={{ fontSize: 10, color: C.textMuted, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.venue}</div>}
                            </div>
                            <div style={{ width: 30, height: 30, borderRadius: 7, background: tclo(homeHue), border: '1.5px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: tc(homeHue), flexShrink: 0 }}>
                              {teamInitials(m.home?.name || '')}
                            </div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            {isCompleted && m.home_score !== null ? (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 20, fontWeight: 900, color: homeWin ? C.accent : isDraw ? C.text : C.textMuted }}>{m.home_score}</span>
                                  <span style={{ fontSize: 11, color: C.textMuted }}>-</span>
                                  <span style={{ fontSize: 20, fontWeight: 900, color: awayWin ? C.accent : isDraw ? C.text : C.textMuted }}>{m.away_score}</span>
                                </div>
                                <div style={{ fontSize: 8, color: C.textMuted, letterSpacing: 0.5 }}>MATCHPOANG</div>
                              </>
                            ) : (
                              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{d.time}</div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 7, background: tclo(awayHue), border: '1.5px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: tc(awayHue), flexShrink: 0 }}>
                              {teamInitials(m.away?.name || '')}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: awayWin ? 800 : 500, color: awayWin ? C.text : C.textMuted, whiteSpace: 'nowrap' }}>{m.away?.name?.replace(' A', '').replace(' H', '') || '?'}</div>
                              {m.oil_profile && <div style={{ fontSize: 10, color: C.textMuted }}>{m.oil_profile}</div>}
                            </div>
                          </div>

                          <div style={{ color: C.textMuted, fontSize: 14, textAlign: 'center' }}>›</div>
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
