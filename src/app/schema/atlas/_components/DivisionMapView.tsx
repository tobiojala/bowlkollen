'use client'

import { useMemo } from 'react'
import { COLOR } from '@/lib/brand'
import { groupDivisionsByTier, MOSAIC_TIERS, MOSAIC_TIER_COLOR, divisionColor } from '@/lib/division-standings'
import { buildIdentityPalette, heatmapColor } from '@/app/schema/_components/week'

type DivisionRow = { bits_division_id: number; name: string }
type SeasonMonth  = { year: number; month: number }

type Props = {
  divisions:        DivisionRow[]
  datesByDivision:  Map<number, string[]>
  seasonMonths:     SeasonMonth[]
  activeDivisionId: number | null
  onSelect:         (divisionId: number) => void
}

// SVG viewBox — displayed at width="100%" so cells scale with tile width.
const VB_W     = 280
const CELL     = 22
const MGAP     = 6    // gap between month columns
const WGAP     = 2    // gap between week rows
const MAX_ROWS = 5
const VB_H     = MAX_ROWS * CELL + (MAX_ROWS - 1) * WGAP  // 118

const todayStr = new Date().toISOString().slice(0, 10)

function isoMonday(date: Date): Date {
  const d   = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

type Rect = { x: number; y: number; w: number; fill: string }

function buildRects(months: SeasonMonth[], dates: string[], palette: readonly string[]): Rect[] {
  const weekMap = new Map<string, number>()
  for (const raw of dates) {
    const dk = raw.slice(0, 10)
    const wk = isoMonday(new Date(dk + 'T12:00:00')).toISOString().slice(0, 10)
    weekMap.set(wk, (weekMap.get(wk) ?? 0) + 1)
  }
  const maxCount = Math.max(...weekMap.values(), 1)
  const n  = Math.min(months.length, 10)
  const mW = (VB_W - (n - 1) * MGAP) / n

  const rects: Rect[] = []
  months.slice(0, n).forEach((m, mi) => {
    const bx  = mi * (mW + MGAP)
    const end = new Date(m.year, m.month + 1, 0)
    let cur   = isoMonday(new Date(m.year, m.month, 1))
    let row   = 0
    while (cur <= end && row < MAX_ROWS) {
      const wk    = cur.toISOString().slice(0, 10)
      const count = weekMap.get(wk) ?? 0
      rects.push({ x: bx, y: row * (CELL + WGAP), w: mW, fill: heatmapColor(count, maxCount, wk > todayStr, palette) })
      cur.setDate(cur.getDate() + 7)
      row++
    }
  })
  return rects
}

function shortName(name: string): string {
  return name.replace(/\s+Herrar$/i, '').replace(/\s+Damer$/i, '').trim()
}

/** The Atlas map view — all division grids laid out simultaneously on the
 * dark surface, GitHub-style. No card chrome, no borders, just the grids
 * themselves so the eye goes straight to where the season is alive.
 * The currently-focused division gets a gold label + outline: "you are here." */
export function DivisionMapView({ divisions, datesByDivision, seasonMonths, activeDivisionId, onSelect }: Props) {
  const groups = useMemo(() => {
    const all = groupDivisionsByTier(divisions)
    return new Map(MOSAIC_TIERS.filter(t => all.has(t)).map(t => [t, all.get(t)!] as const))
  }, [divisions])

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px 80px' }}>
      {[...groups.entries()].map(([tier, tierDivs]) => {
        const base = MOSAIC_TIER_COLOR[tier] ?? '#6e8898'

        return (
          <section key={tier} style={{ marginBottom: 20 }}>
            {/* Tier label — just a small colored marker, no card chrome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8 }}>
              <div style={{ width: 3, height: 10, borderRadius: 2, background: base, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: base }}>
                {tier}
              </span>
              <span style={{ fontSize: 9, color: COLOR.ink4 }}>{tierDivs.length}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 12px' }}>
              {tierDivs.map(d => {
                const dColor    = divisionColor(base, d.name)
                const palette   = buildIdentityPalette(dColor)
                const dates     = datesByDivision.get(d.bits_division_id) ?? []
                const rects     = buildRects(seasonMonths, dates, palette)
                const isCurrent = d.bits_division_id === activeDivisionId

                return (
                  <button
                    key={d.bits_division_id}
                    onClick={() => onSelect(d.bits_division_id)}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', flexDirection: 'column', gap: 4,
                      WebkitTapHighlightColor: 'transparent',
                    } as React.CSSProperties}
                  >
                    <span style={{
                      fontSize: 10, fontWeight: isCurrent ? 700 : 500, lineHeight: 1,
                      color: isCurrent ? COLOR.gold : dColor,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      width: '100%',
                    }}>
                      {shortName(d.name)}
                    </span>

                    {/* The grid itself — no border-radius, no shadow, just the cells */}
                    <svg
                      viewBox={`0 0 ${VB_W} ${VB_H}`}
                      width="100%"
                      style={{
                        display: 'block',
                        outline: isCurrent ? `2px solid ${COLOR.gold}` : 'none',
                        outlineOffset: '2px',
                      }}
                    >
                      {rects.map((r, i) => (
                        <rect key={i} x={r.x} y={r.y} width={r.w} height={CELL} rx={2} fill={r.fill} />
                      ))}
                    </svg>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
