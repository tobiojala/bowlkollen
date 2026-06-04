'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'

export default function MatchDayStrip() {
  const [dates, setDates] = useState<string[]>([])
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeDateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select('date')
      .not('round', 'is', null)
      .order('date')
      .then(({ data }) => {
        if (!data) return
        const allDates = [...new Set(data.map((m: { date: string }) => m.date.slice(0, 10)))].sort()
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
        container.scrollTo({
          left: el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2,
          behavior: 'smooth',
        })
      }, 150)
    }
  }, [activeDate, dates])

  if (dates.length === 0) return null

  const today = new Date().toISOString().slice(0, 10)
  const days = ['Son', 'Man', 'Tis', 'Ons', 'Tor', 'Fre', 'Lor']
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

  return (
    <div
      className={cn(
        'sticky top-14 z-30 border-b',
        'border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg',
      )}
    >
      <div
        ref={scrollRef}
        className={cn(
          'flex overflow-x-auto',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {dates.map(dateKey => {
          const d = new Date(`${dateKey}T12:00:00`)
          const isActive = dateKey === activeDate
          const isToday = dateKey === today
          const isPast = dateKey < today

          return (
            <div
              key={dateKey}
              ref={isActive ? activeDateRef : null}
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveDate(dateKey)
                window.location.href = `/schema?date=${dateKey}`
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveDate(dateKey)
                  window.location.href = `/schema?date=${dateKey}`
                }
              }}
              className={cn(
                'flex shrink-0 cursor-pointer flex-col items-center gap-px px-3.5 py-2.5 select-none',
                'border-b-2',
                isActive ? 'border-gold' : 'border-transparent',
                isPast && !isActive && 'opacity-35',
              )}
            >
              <span
                className={cn(
                  'text-[9px] font-bold tracking-wide',
                  isActive ? 'text-gold' : 'text-dark-muted',
                )}
              >
                {isToday ? 'IDAG' : days[d.getDay()].toUpperCase()}
              </span>
              <span
                className={cn(
                  'text-sm',
                  isActive ? 'font-bold text-gold' : 'font-normal bk-text-primary',
                )}
              >
                {d.getDate()} {months[d.getMonth()]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
