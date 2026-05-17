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
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeDateRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select('date')
      .not('round', 'is', null)
      .order('date')
      .then(({ data }) => {
        if (!data) return
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

  return (
    <div style={{ borderBottom: '1px solid ' + C.border, background: C.bg, position: 'sticky', top: 56, zIndex: 30 }}>
      <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex' }}>
        {dates.map(dateKey => {
          const d = new Date(dateKey + 'T12:00:00')
          const isActive = dateKey === activeDate
          const isToday = dateKey === today
          const isPast = dateKey < today
          return (
            
              key={dateKey}
              href={'/schema?date=' + dateKey}
              ref={isActive ? (activeDateRef as any) : null}
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
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: isActive ? '#f5c200' : C.textMuted }}>
                {isToday ? 'IDAG' : days[d.getDay()].toUpperCase()}
              </span>
              <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 400, color: isActive ? '#f5c200' : C.text }}>
                {d.getDate()} {months[d.getMonth()]}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
