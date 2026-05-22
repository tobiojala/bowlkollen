'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName } from '@/lib/utils'

type Team = { id: string; name: string }
type Match = {
  id: string
  date: string
  status: string
  round: number
  home_score: number | null
  away_score: number | null
  venue: string
  division: string
  home_team_id: string
  away_team_id: string
  home: Team
  away: Team
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
  if (division.includes('SM')) return '#f5c200'
  if (division.includes('Elitserien') && division.includes('Damer')) return '#d94a90'
  if (division.includes('Elitserien')) return '#4a90d9'
  if (getTier(division) === 2) return '#5ba85a'
  return '#8a7a5a'
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
  const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
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

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 56, background: C.bg, zIndex: 30, borderBottom: '1px solid ' + C.border }}>

        {/* Date strip */}
        <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex' } as any}>
          {dates.map(dateKey => {
            const d = new Date(dateKey + 'T12:00:00')
            const isActive = dateKey === activeDate
            const isToday = dateKey === now
            const isPast = dateKey < now
            return (
              <button key={dateKey} ref={isActive ? activeDateRef : null} onClick={() => setActiveDate(dateKey)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', border: 'none', borderBottom: '2px solid ' + (isActive ? C.accent : 'transparent'), background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', opacity: isPast && !isActive ? 0.35 : 1, gap: 1, WebkitTapHighlightColor: 'transparent' } as any}
              >
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: isActive ? C.accent : C.textMuted }}>
                  {isToday ? 'IDAG' : days[d.getDay()].toUpperCase()}
                </span>
                <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 400, color: isActive ? C.accent : C.text }}>
                  {d.getDate()} {months[d.getMonth()]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filter pills */}
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '8px 16px' } as any}>
          {([
            { key: 'all', label: 'Alla' },
            { key: 'elite', label: 'Elitserien' },
            { key: 'allsvenskan', label: 'Allsvenskan' },
            { key: 'div1', label: 'Division 1' },
          ] as const).map(f => {
            const isActive = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ background: isActive ? C.accent : 'transparent', border: '1px solid ' + (isActive ? C.accent : C.border), borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: isActive ? '#1a1400' : C.textMuted, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, WebkitTapHighlightColor: 'transparent' } as any}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Match list */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 48px' }}>
        {activeMatches.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga matcher den här dagen
          </div>
        )}

        {divisions.map(div => {
          const divMatches = activeMatches.filter(m => m.division === div)
          const divColor = getDivColor(div)

          return (
            <div key={div}>
              {/* Division header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 6px', borderBottom: '1px solid ' + C.border }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: divColor, flexShrink: 0 }} />
                <div style={{ fontSize: 10, fontWeight: 800, color: divColor, letterSpacing: 1.5 }}>
                  {div.toUpperCase()}
                </div>
              </div>

              {divMatches.map(m => {
                const isCompleted = m.home_score !== null
                const isLive = m.status === 'live'
                const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
                const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)

                return (
                  <a key={m.id} href={'/matches/' + m.id}
                    style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, padding: '10px 8px', textDecoration: 'none', borderRadius: 8, alignItems: 'center', borderLeft: '3px solid ' + divColor, margin: '2px 8px', WebkitTapHighlightColor: 'transparent' } as any}
                    onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Home */}
                    <div style={{ fontSize: 14, fontWeight: homeWin ? 700 : 400, color: isCompleted ? (homeWin ? C.text : C.textMuted) : C.text, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortName(m.home?.name || '')}
                    </div>

                    {/* Score / vs */}
                    <div style={{ textAlign: 'center', minWidth: 56 }}>
                      {isLive && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />
                          <span style={{ fontSize: 8, fontWeight: 800, color: '#e05555', letterSpacing: 0.5 }}>LIVE</span>
                        </div>
                      )}
                      {isCompleted ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: homeWin ? C.accent : C.textMuted, lineHeight: 1 }}>{m.home_score}</span>
                          <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 300 }}>–</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: awayWin ? C.accent : C.textMuted, lineHeight: 1 }}>{m.away_score}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 300 }}>vs</span>
                      )}
                    </div>

                    {/* Away */}
                    <div style={{ fontSize: 14, fontWeight: awayWin ? 700 : 400, color: isCompleted ? (awayWin ? C.text : C.textMuted) : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortName(m.away?.name || '')}
                    </div>
                  </a>
                )
              })}
            </div>
          )
        })}

        {activeMatches.length > 0 && (
          <div style={{ padding: '16px 20px' }}>
            <a href="https://bits.swebowl.se" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none' }}>
              Fullständig info på BITS &#8599;
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
