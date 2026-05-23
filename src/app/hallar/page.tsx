'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { Search, MapPin } from 'lucide-react'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

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
  const router = useRouter()
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

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

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: 96 }}>
      {/* Header */}
      <div style={{
        padding: '56px 20px 16px',
        background: isDark
          ? 'linear-gradient(180deg, rgba(245,194,0,0.06) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(245,194,0,0.04) 0%, transparent 100%)',
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
          Bowlinghallar
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted }}>
          {loading ? 'Laddar...' : `${halls.length} hallar i Sverige`}
        </p>
      </div>

      {/* Search bar */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '10px 14px',
        }}>
          <Search size={16} color={C.textMuted} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök hall eller stad..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.text, fontSize: 15,
            }}
          />
        </div>
      </div>

      {/* Filter chips row */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {/* Toggle chips */}
        {[
          { label: 'Online bokning', active: onlyBooking, set: () => setOnlyBooking(v => !v) },
          { label: 'Online scoring', active: onlyScoring, set: () => setOnlyScoring(v => !v) },
        ].map(chip => (
          <button
            key={chip.label}
            onClick={chip.set}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: chip.active ? '1px solid rgba(245,194,0,0.50)' : `1px solid ${C.border}`,
              background: chip.active ? 'rgba(245,194,0,0.12)' : C.card,
              color: chip.active ? '#f5c200' : C.textMuted,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {chip.label}
          </button>
        ))}

        {/* Region separator */}
        <div style={{ width: 1, background: C.border, margin: '2px 0', flexShrink: 0 }} />

        {/* All regions chip */}
        <button
          onClick={() => setRegion(null)}
          style={{
            flexShrink: 0,
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            border: region === null ? '1px solid rgba(245,194,0,0.50)' : `1px solid ${C.border}`,
            background: region === null ? 'rgba(245,194,0,0.12)' : C.card,
            color: region === null ? '#f5c200' : C.textMuted,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Alla regioner
        </button>
        {regions.map(r => (
          <button
            key={r}
            onClick={() => setRegion(region === r ? null : r)}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: region === r ? '1px solid rgba(245,194,0,0.50)' : `1px solid ${C.border}`,
              background: region === r ? 'rgba(245,194,0,0.12)' : C.card,
              color: region === r ? '#f5c200' : C.textMuted,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && query || region || onlyBooking || onlyScoring ? (
        <p style={{ margin: '0 16px 8px', fontSize: 12, color: C.textMuted }}>
          {filtered.length} resultat
        </p>
      ) : null}

      {/* Hall list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
        <AnimatePresence>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: 88, borderRadius: 16,
                background: C.card,
                border: `1px solid ${C.border}`,
                opacity: 0.5,
              }} />
            ))
          ) : filtered.map((hall, i) => (
            <motion.div
              key={hall.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: Math.min(i * 0.03, 0.3) }}
              onClick={() => router.push(`/hallar/${hall.id}`)}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: '14px 16px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{hall.name}</div>
                  {hall.city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: C.textMuted, fontSize: 13 }}>
                      <MapPin size={12} />
                      {hall.city}
                    </div>
                  )}
                  {/* Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {hall.lanes && (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 10,
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        color: C.textMuted,
                      }}>
                        {hall.lanes} banor
                      </span>
                    )}
                    {hall.online_booking && (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 10,
                        background: 'rgba(76,175,125,0.13)',
                        color: '#4caf7d',
                      }}>
                        Online-bokning
                      </span>
                    )}
                    {hall.online_scoring && (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 10,
                        background: 'rgba(245,194,0,0.11)',
                        color: '#f5c200',
                      }}>
                        Online-scoring
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ color: C.textMuted, fontSize: 20, marginLeft: 8 }}>›</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: C.textMuted, padding: '48px 0', fontSize: 14 }}>
            Inga hallar hittades
          </div>
        )}
      </div>
    </div>
  )
}
