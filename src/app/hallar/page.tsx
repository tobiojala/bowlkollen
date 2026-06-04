'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Search, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FilterChip } from '@/components/ui'

type Hall = {
  id: number
  name: string
  city: string | null
  street_address: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  website: string | null
  region: string | null
  lanes: number | null
  machine_type: string | null
  lane_type: string | null
  online_scoring: boolean
  online_scoring_url: string | null
  online_booking: boolean
  online_booking_url: string | null
  accepts_gift_cards: boolean
  inspection_status: string | null
}

export default function HallarPage() {
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<string | null>(null)
  const [onlyBooking, setOnlyBooking] = useState(false)
  const [onlyScoring, setOnlyScoring] = useState(false)

  useEffect(() => {
    const db = createClient()
    db.from('bowling_centers')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setHalls((data as Hall[]) ?? [])
        setLoading(false)
      })
  }, [])

  const regions = useMemo(() => {
    const s = new Set<string>()
    halls.forEach(h => { if (h.region) s.add(h.region) })
    return [...s].sort()
  }, [halls])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return halls.filter(h => {
      if (q && !h.name.toLowerCase().includes(q) && !(h.city ?? '').toLowerCase().includes(q)) return false
      if (region && h.region !== region) return false
      if (onlyBooking && !h.online_booking) return false
      if (onlyScoring && !h.online_scoring) return false
      return true
    })
  }, [halls, query, region, onlyBooking, onlyScoring])

  const hasFilters = !!(query || region || onlyBooking || onlyScoring)

  return (
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg">
      <div className="px-5 pt-14 pb-4">
        <h1 className="m-0 text-[26px] font-black tracking-tight bk-text-primary">Bowlinghallar</h1>
        <p className="mt-1 text-[13px] text-dark-muted">
          {loading ? 'Laddar...' : `${halls.length} hallar i Sverige`}
        </p>
      </div>

      <div className="px-4 pt-3">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-[14px] border px-3.5 py-2.5',
            'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
          )}
        >
          <Search size={16} className="shrink-0 text-dark-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök hall eller stad..."
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none bk-text-primary placeholder:text-dark-muted"
          />
        </div>
      </div>

      <div
        className={cn(
          'flex gap-2 overflow-x-auto px-4 py-3',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        <FilterChip active={onlyBooking} onClick={() => setOnlyBooking(v => !v)}>
          Online bokning
        </FilterChip>
        <FilterChip active={onlyScoring} onClick={() => setOnlyScoring(v => !v)}>
          Online scoring
        </FilterChip>
        <div className="mx-0.5 w-px shrink-0 self-stretch bg-light-border dark:bg-dark-border" />
        <FilterChip active={region === null} onClick={() => setRegion(null)}>
          Alla regioner
        </FilterChip>
        {regions.map(r => (
          <FilterChip
            key={r}
            active={region === r}
            onClick={() => setRegion(region === r ? null : r)}
          >
            {r}
          </FilterChip>
        ))}
      </div>

      {!loading && hasFilters && (
        <p className="mx-4 mb-2 text-xs text-dark-muted">{filtered.length} resultat</p>
      )}

      <div className="flex flex-col gap-2 px-4">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-[88px] animate-pulse rounded-2xl border border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card"
              />
            ))
          : filtered.map(hall => (
              <Link
                key={hall.id}
                href={`/hallar/${hall.id}`}
                className={cn(
                  'block rounded-2xl border p-4 no-underline transition-colors',
                  'border-light-border bg-light-card active:scale-[0.99]',
                  'dark:border-dark-border dark:bg-dark-card',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] leading-tight font-bold bk-text-primary">{hall.name}</div>
                    {hall.city && (
                      <div className="mt-1 flex items-center gap-1 text-[13px] text-dark-muted">
                        <MapPin size={12} />
                        {hall.city}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {hall.lanes != null && (
                        <span className="rounded-[10px] bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-dark-muted dark:bg-white/6">
                          {hall.lanes} banor
                        </span>
                      )}
                      {hall.online_booking && (
                        <span className="rounded-[10px] bg-blue/15 px-2 py-0.5 text-[11px] font-semibold text-blue">
                          Online-bokning
                        </span>
                      )}
                      {hall.online_scoring && (
                        <span className="rounded-[10px] bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">
                          Online-scoring
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="ml-2 shrink-0 text-xl text-dark-muted" aria-hidden>›</span>
                </div>
              </Link>
            ))}

        {!loading && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-dark-muted">Inga hallar hittades</p>
        )}
      </div>
    </div>
  )
}
