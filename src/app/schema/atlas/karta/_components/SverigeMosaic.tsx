'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { COLOR } from '@/lib/brand'
import { MOSAIC_TIERS, MOSAIC_TIER_COLOR, divisionTier, divisionColor } from '@/lib/division-standings'

export type MapDivision = { id: number; name: string; color: string; hot: boolean; live: boolean }

type Props = {
  divisions: { bits_division_id: number; name: string }[]
  datesByDivision: Map<number, string[]>
  onOpen: (d: MapDivision) => void
}

// ── Geography from division names — Swedish bowling is literally regional ────
type Region = 'norrland' | 'norra' | 'svealand' | 'elit' | 'gotaland' | 'sodra'

function regionOf(name: string): Region {
  if (name.includes('Elitserien'))       return 'elit'
  if (/norrland/i.test(name))            return 'norrland'
  if (/svealand|mellan|östra|västra/i.test(name)) return 'svealand'
  if (/götaland/i.test(name))            return 'gotaland'
  if (/norra|nord/i.test(name))          return 'norra'
  if (/södra|syd/i.test(name))           return 'sodra'
  return 'svealand'
}

// Bands top→bottom trace Sweden's silhouette: Norrland leans northeast,
// the country narrows through Svealand, widens over Götaland, tapers in Skåne.
const BANDS: { key: Region; label: string; padLeft: string; padRight: string }[] = [
  { key: 'norrland', label: 'NORRLAND',   padLeft: '26%', padRight: '4%'  },
  { key: 'norra',    label: 'NORRA',      padLeft: '18%', padRight: '8%'  },
  { key: 'svealand', label: 'SVEALAND',   padLeft: '10%', padRight: '10%' },
  { key: 'elit',     label: 'ELITSERIEN', padLeft: '14%', padRight: '14%' },
  { key: 'gotaland', label: 'GÖTALAND',   padLeft: '4%',  padRight: '6%'  },
  { key: 'sodra',    label: 'SÖDRA',      padLeft: '12%', padRight: '20%' },
]

const TIER_SIZE: Record<string, number> = {
  'Elitserien': 76, 'Allsvenskan': 60, 'Mellanallsvenskan': 56,
  'Division 1': 48, 'Division 2': 40, 'Division 3': 34,
}

function alpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// "Division 1 Norra Svealand" → "Norra Svealand"; "Elitserien Herrar" → "Herrar"
function squareLabel(name: string): string {
  return name
    .replace(/^(Division\s*\d|Div\s*\d|Mellanallsvenskan|Allsvenskan|Elitserien)\s*/i, '')
    .trim() || name
}
function initials(label: string): string {
  return label.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

const todayStr = new Date().toISOString().slice(0, 10)
const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

/** Level 0 — Sverige. Every square IS a division (never a date), placed
 * roughly where it lives in the country. Size = tier, glow = hot right now.
 * Tapping a square splits it open into the division's omgångar. */
export function SverigeMosaic({ divisions, datesByDivision, onOpen }: Props) {
  const byRegion = useMemo(() => {
    const m = new Map<Region, MapDivision[]>()
    for (const d of divisions) {
      const tier = divisionTier(d.name)
      if (!(MOSAIC_TIERS as readonly string[]).includes(tier)) continue
      const base  = MOSAIC_TIER_COLOR[tier] ?? '#6e8898'
      const dates = datesByDivision.get(d.bits_division_id) ?? []
      const hot   = dates.some(x => x >= todayStr && x <= weekAhead)
      const live  = dates.includes(todayStr)
      const div: MapDivision = {
        id: d.bits_division_id, name: d.name,
        color: tier === 'Elitserien' ? COLOR.gold : divisionColor(base, d.name),
        hot, live,
      }
      const r = regionOf(d.name)
      if (!m.has(r)) m.set(r, [])
      m.get(r)!.push(div)
    }
    // Bigger tiers first within each band
    m.forEach(list => list.sort((a, b) =>
      (TIER_SIZE[divisionTier(b.name)] ?? 30) - (TIER_SIZE[divisionTier(a.name)] ?? 30)))
    return m
  }, [divisions, datesByDivision])

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '8px 12px 90px',
      scrollbarWidth: 'none' } as React.CSSProperties}>
      {BANDS.map(band => {
        const divs = byRegion.get(band.key) ?? []
        if (divs.length === 0) return null
        return (
          <div key={band.key} style={{ paddingLeft: band.padLeft, paddingRight: band.padRight,
            marginBottom: 18 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: COLOR.ink4,
              marginBottom: 6 }}>
              {band.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
              {divs.map(d => {
                const size  = TIER_SIZE[divisionTier(d.name)] ?? 34
                const label = squareLabel(d.name)
                return (
                  <motion.button key={d.id} layoutId={`karta-div-${d.id}`}
                    onClick={() => onOpen(d)} whileTap={{ scale: 0.92 }}
                    animate={{ scale: d.hot ? 1.06 : 1 }}
                    style={{
                      width: size, height: size, borderRadius: 12,
                      background: alpha(d.color, d.hot ? 0.30 : 0.14),
                      border: `1px solid ${alpha(d.color, d.hot ? 0.8 : 0.35)}`,
                      boxShadow: d.hot ? `0 0 14px ${alpha(d.color, 0.35)}` : 'none',
                      cursor: 'pointer', position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 3, WebkitTapHighlightColor: 'transparent',
                    } as React.CSSProperties}
                    aria-label={d.name}>
                    {d.live && (
                      <span style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5,
                        borderRadius: '50%', background: COLOR.red, boxShadow: `0 0 5px ${COLOR.red}` }} />
                    )}
                    <span style={{
                      fontSize: size >= 60 ? 9.5 : 8, fontWeight: 800, lineHeight: 1.2,
                      color: d.color, textAlign: 'center', overflow: 'hidden',
                    }}>
                      {size >= 48 ? label : initials(label)}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div style={{ padding: '4px 8px', fontSize: 10, color: COLOR.ink4 }}>
        Varje ruta är en division — glöd = matcher inom 7 dagar. Tryck för att öppna.
      </div>
    </div>
  )
}
