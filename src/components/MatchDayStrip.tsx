'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

export default function MatchDayStrip() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [dates, setDates] = useState<string[]>([])
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [activeMatches, setActiveMatches] = useState<any[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
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
        if (!data) return
        const allDates = [...new Set((data as any[]).map(m => m.date.slice(0, 10)))].sort()
        setDates(allDates)
        const today = new Date().toISOString().slice(0, 10)
        const target = allDates.find(d => d >= today) || allDates[allDates.length - 1]
        setActiveDate(target)
        setActiveMatches((data as any[]).filter(m => m.date.slice(0, 10) === target))
      })
  }, [])

  useEffect(() => {
    if (activeDateRef.current && scrollRef.current) {
      setTimeout(() => {
        const el = activeDateRef.current!
        const container = scrollRef.current!
        container.scrollTo({ left: el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
      }, 100)
    }
  }, [activeDate])

  const handleDateClick = async (dateKey: string) => {
    setActiveDate(dateKey)
    const supabase = createClient()
    const { data } = await supabase
      .from('matches')
      .select('id, date, status, home_score, away_score, home:teams!home_team_id(name), away:teams!away_team_id(name)')
      .gte('date', dateKey + 'T00:00:00')
      .lte('date', dateKey + 'T23:59:59')
      .not('round', 'is', null)
      .order('date')
    setActiveMatches(data || [])
  }

  if (dates.length === 0) return null

  const today = new Date().toISOString().slice(0, 10)
  const days = ['Sön','Mån','Tis','Ons','Tor','Fre','Lör']
  const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']

  const shortName = (name: string) =>
    name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()

  return (
    <div style={{ borderBottom: '1px solid ' + C.border, marginBottom: 32 }}>

      {/* Date strip */}
      <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex' }}>
        {dates.map(dateKey => {
          const d = new Date(dateKey + 'T12:00:00')
          const isActive = dateKey === activeDate
          const isToday = dateKey === today
          const isPast = dateKey < today
          return (
            <button
              key={dateKey}
              ref={isActive ? activeDateRef : null}
              onClick={() => handleDateClick(dateKey)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 16px',
                border: 'none',
                borderBottom: '2px solid ' + (isActive ? '#f5c200' : 'transparent'),
                background: 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                opacity: isPast && !isActive ? 0.4 : 1,
                gap: 2,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: isActive ? '#f5c200' : C.textMuted }}>
                {isToday ? 'IDAG' : days[d.getDay()].toUpperCase()}
              </span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? '#f5c200' : C.text }}>
                {d.getDate()} {months[d.getMonth()]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Subtle match list for active date */}
      {activeMatches.length > 0 && (
        <div style={{ padding: '8px 0 10px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {activeMatches.map(m => {
            const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
            const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
            const hasScore = m.home_score !== null
            return (
              <a key={m.id} href={'/matches/' + m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: C.card, borderRadius: 8, border: '1px solid ' + C.border, textDecoration: 'none', flexShrink: 0, fontSize: 12 }}>
                <span style={{ color: homeWin ? C.text : C.textMuted, fontWeight: homeWin ? 600 : 400 }}>
                  {shortName(m.home?.name || '')}
                </span>
                <span style={{ color: C.textMuted, fontSize: 11, minWidth: 28, textAlign: 'center', fontWeight: 700 }}>
                  {hasScore ? m.home_score + '-' + m.away_score : 'vs'}
                </span>
                <span style={{ color: awayWin ? C.text : C.textMuted, fontWeight: awayWin ? 600 : 400 }}>
                  {shortName(m.away?.name || '')}
                </span>
              </a>
            )
          })}
          <a href="/schema" style={{ padding: '5px 10px', fontSize: 11, color: C.textMuted, textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            Schema &rarr;
          </a>
        </div>
      )}

    </div>
  )
}
