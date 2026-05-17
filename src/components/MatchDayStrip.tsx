'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

export default function MatchDayStrip() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [allMatches, setAllMatches] = useState<any[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeDateRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select('id, date, status, home_score, away_score, division, home:teams!home_team_id(name), away:teams!away_team_id(name)')
      .not('round', 'is', null)
      .order('date')
      .then(({ data }) => {
        if (!data) return
        setAllMatches(data as any[])
        const allDates = [...new Set((data as any[]).map((m: any) => m.date.slice(0, 10)))].sort()
        setDates(allDates)
        const today = new Date().toISOString().slice(0, 10)
        const target = allDates.find(d => d >= today) || allDates[allDates.length - 1]
        setActiveDate(target)
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
  }, [activeDate, dates])

  if (dates.length === 0) return null

  const today = new Date().toISOString().slice(0, 10)
  const days = ['Sön','Mån','Tis','Ons','Tor','Fre','Lör']
  const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
  const activeMatches = activeDate ? allMatches.filter((m: any) => m.date.slice(0, 10) === activeDate) : []

  const shortName = (name: string) =>
    name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()

  return (
    <div style={{ borderBottom: '1px solid ' + C.border, marginBottom: 0 }}>
      {/* Date strip */}
      <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex' }}>
        <style>{`.date-strip::-webkit-scrollbar { display: none; }`}</style>
        {dates.map(dateKey => {
          const d = new Date(dateKey + 'T12:00:00')
          const isActive = dateKey === activeDate
          const isToday = dateKey === today
          const isPast = dateKey < today
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

      {/* Matches for selected date */}
      {activeMatches.length > 0 && (
        <div style={{ padding: '8px 16px 12px' }}>
          {activeMatches.map((m: any) => {
            const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
            const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
            const hasScore = m.home_score !== null
            const isLive = m.status === 'live'
            return (
              <a key={m.id} href={'/matches/' + m.id} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid ' + C.border, textDecoration: 'none', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: homeWin ? C.text : C.textMuted, textAlign: 'right', letterSpacing: -0.2 }}>
                  {shortName(m.home?.name || '')}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, minWidth: 52, textAlign: 'center', color: isLive ? '#e05555' : hasScore ? C.accent : C.textMuted, letterSpacing: 0.5 }}>
                  {isLive ? '● LIVE' : hasScore ? m.home_score + ' - ' + m.away_score : 'vs'}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: awayWin ? C.text : C.textMuted, letterSpacing: -0.2 }}>
                  {shortName(m.away?.name || '')}
                </span>
              </a>
            )
          })}
          <a href="/schema" style={{ display: 'block', textAlign: 'center', fontSize: 11, color: C.textMuted, textDecoration: 'none', paddingTop: 8 }}>
            Se fullstandigt schema &rarr;
          </a>
        </div>
      )}
    </div>
  )
}
