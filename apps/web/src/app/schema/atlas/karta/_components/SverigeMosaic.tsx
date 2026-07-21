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
type Region = 'norrland' | 'norra' | 'svealand' | 'gotaland' | 'sodra'

function regionOf(name: string): Region | 'elit' {
  if (name.includes('Elitserien'))       return 'elit'
  if (/norrland/i.test(name))            return 'norrland'
  if (/svealand|mellan|östra|västra/i.test(name)) return 'svealand'
  if (/götaland/i.test(name))            return 'gotaland'
  if (/norra|nord/i.test(name))          return 'norra'
  if (/södra|syd/i.test(name))           return 'sodra'
  return 'svealand'
}

// Bands run north→south. `inset` traces Sweden's width at that latitude:
// narrow in the far north, widest through Götaland, tapering into Skåne — and
// swaying east/west so the column of squares reads as a coastline, not a list.
const BANDS: { key: Region; label: string; insetL: string; insetR: string }[] = [
  { key: 'norrland', label: 'Norrland', insetL: '30%', insetR: '12%' },
  { key: 'norra',    label: 'Norra',    insetL: '22%', insetR: '9%'  },
  { key: 'svealand', label: 'Svealand', insetL: '12%', insetR: '8%'  },
  { key: 'gotaland', label: 'Götaland', insetL: '5%',  insetR: '13%' },
  { key: 'sodra',    label: 'Södra',    insetL: '20%', insetR: '24%' },
]

// Size = tier. Pushed harder than before so altitude reads instantly.
const TIER_SIZE: Record<string, number> = {
  'Elitserien': 84, 'Allsvenskan': 62,
  'Division 1': 48, 'Division 2': 40, 'Division 3': 34,
}
const CROWN_SIZE = 88

function alpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// "Division 1 Norra Svealand" → "Norra Svealand"; "Elitserien Herrar" → "Herrar"
function squareLabel(name: string): string {
  return name
    .replace(/^(Division\s*\d|Div\s*\d|Mellanallsvenskan|Nordallsvenskan|Sydallsvenskan|Allsvenskan|Elitserien)\s*/i, '')
    .trim() || name
}
function initials(label: string): string {
  return label.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

const todayStr  = new Date().toISOString().slice(0, 10)
const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

// Stylized Sweden silhouette — a faint watermark that anchors the whole map as
// a country, not a stack of rows. Pointed north, Bothnian bulge, Skåne tail.
function SwedenBackdrop() {
  return (
    <svg
      viewBox="0 0 200 460" preserveAspectRatio="xMidYMid meet"
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none' }}
    >
      <defs>
        <linearGradient id="sv-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"   stopColor={COLOR.gold} stopOpacity="0.07" />
          <stop offset="0.55" stopColor={COLOR.gold} stopOpacity="0.02" />
          <stop offset="1"   stopColor={COLOR.ink}  stopOpacity="0.015" />
        </linearGradient>
      </defs>
      <path
        d="M96 12 C108 40 120 70 122 105 C124 140 138 165 140 200 C142 235 150 260 144 292
           C138 320 128 345 112 372 C104 388 96 402 88 388 C80 372 74 350 66 320
           C60 292 50 268 54 232 C58 196 46 168 50 132 C54 98 62 58 78 30 C84 20 90 14 96 12 Z"
        fill="url(#sv-fill)"
        stroke={COLOR.ink3}
        strokeOpacity="0.28"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function DivisionSquare({ d, size, big, onOpen }: { d: MapDivision; size: number; big?: boolean; onOpen: (d: MapDivision) => void }) {
  const label = squareLabel(d.name)
  return (
    <motion.button
      layoutId={`karta-div-${d.id}`}
      whileTap={{ scale: 0.92 }}
      onClick={() => onOpen(d)}
      style={{
        width: size, height: size, borderRadius: big ? 16 : 12,
        // Size = tier, glow = hot. Fill/border intensity carries "now", not scale.
        background: alpha(d.color, d.hot ? 0.32 : 0.13),
        border: `1px solid ${alpha(d.color, d.hot ? 0.9 : 0.32)}`,
        boxShadow: d.hot ? `0 0 18px ${alpha(d.color, 0.4)}, inset 0 0 12px ${alpha(d.color, 0.15)}` : 'none',
        cursor: 'pointer', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 4, WebkitTapHighlightColor: 'transparent',
      } as React.CSSProperties}
      aria-label={d.name}
    >
      {d.live && (
        <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6,
          borderRadius: '50%', background: COLOR.red, boxShadow: `0 0 6px ${COLOR.red}` }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%',
            background: COLOR.red, animation: 'kartaPulse 1.4s ease-in-out infinite' }} />
        </span>
      )}
      <span style={{
        fontSize: big ? 11 : size >= 58 ? 10 : 8, fontWeight: 800, lineHeight: 1.2,
        color: d.hot ? d.color : alpha(d.color, 0.85), textAlign: 'center', overflow: 'hidden',
      }}>
        {size >= 46 ? label : initials(label)}
      </span>
    </motion.button>
  )
}

/** Level 0 — Sverige. Every square IS a division (never a date), placed roughly
 * where it lives in the country. Elitserien crowns the map as the national tier;
 * everything else falls into a geographic band. Size = tier, glow = live now. */
export function SverigeMosaic({ divisions, datesByDivision, onOpen }: Props) {
  const { crown, byRegion } = useMemo(() => {
    const crown: MapDivision[] = []
    const byRegion = new Map<Region, MapDivision[]>()
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
      if (r === 'elit') { crown.push(div); continue }
      if (!byRegion.has(r)) byRegion.set(r, [])
      byRegion.get(r)!.push(div)
    }
    // Bigger tiers first within each band
    byRegion.forEach(list => list.sort((a, b) =>
      (TIER_SIZE[divisionTier(b.name)] ?? 30) - (TIER_SIZE[divisionTier(a.name)] ?? 30)))
    return { crown, byRegion }
  }, [divisions, datesByDivision, onOpen])

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <style>{`@keyframes kartaPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(2.4);opacity:0}}`}</style>
      <SwedenBackdrop />

      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto',
        padding: '4px 16px 96px', scrollbarWidth: 'none' } as React.CSSProperties}>

        {/* Elitserien — the national crown, above the geography */}
        {crown.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 0 18px', position: 'relative' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: COLOR.gold,
              opacity: 0.85, marginBottom: 10 }}>
              ELITSERIEN
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {crown.map(d => <DivisionSquare key={d.id} d={d} size={CROWN_SIZE} big onOpen={onOpen} />)}
            </div>
            {/* hairline tying the crown to the map below */}
            <div style={{ width: 1, height: 16, marginTop: 8,
              background: `linear-gradient(${alpha(COLOR.gold, 0.4)}, transparent)` }} />
          </div>
        )}

        {/* Geographic bands, north → south */}
        {BANDS.map(band => {
          const divs = byRegion.get(band.key) ?? []
          if (divs.length === 0) return null
          return (
            <div key={band.key} style={{ marginLeft: band.insetL, marginRight: band.insetR,
              marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: COLOR.ink3, opacity: 0.5 }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: COLOR.ink3 }}>
                  {band.label.toUpperCase()}
                </span>
                <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${alpha(COLOR.ink3, 0.18)}, transparent)` }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                {divs.map(d => (
                  <DivisionSquare key={d.id} d={d} size={TIER_SIZE[divisionTier(d.name)] ?? 34} onOpen={onOpen} />
                ))}
              </div>
            </div>
          )
        })}

        <div style={{ padding: '8px 4px 0', fontSize: 10, color: COLOR.ink4, textAlign: 'center' }}>
          Varje ruta är en division · storlek = nivå · glöd = spelas inom 7 dagar
        </div>
      </div>
    </div>
  )
}
