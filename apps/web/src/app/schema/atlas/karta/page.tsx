'use client'

// Kartan — the Atlas as a fractal map. Squares are THINGS, never dates:
// Sverige is a mosaic of divisions laid out geographically; a division
// splits into omgångar (or teams); a round splits into matches. Zooming
// means a square opening to reveal the squares inside it — Google Earth
// over the season, with the calendar nowhere in sight.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { COLOR } from '@/lib/brand'
import { useSeasonMatchDates, useAllDivisions } from '@/lib/queries'
import { SverigeMosaic } from './_components/SverigeMosaic'
import type { MapDivision } from './_components/SverigeMosaic'
import { DivisionSquares } from './_components/DivisionSquares'

const NAV_H = 56

export default function KartanPage() {
  const { data: rows = [], isLoading: datesLoading } = useSeasonMatchDates()
  const { data: divisions = [], isLoading: divisionsLoading } = useAllDivisions()
  const [open, setOpen] = useState<MapDivision | null>(null)

  const datesByDivision = useMemo(() => {
    const m = new Map<number, string[]>()
    for (const r of rows) {
      const arr = m.get(r.bits_division_id)
      if (arr) arr.push(r.match_date); else m.set(r.bits_division_id, [r.match_date])
    }
    return m
  }, [rows])

  const loading = datesLoading || divisionsLoading

  return (
    <div
      style={{
        position: 'fixed', top: NAV_H, bottom: 0,
        left: 'max(0px, calc(50vw - 300px))', right: 'max(0px, calc(50vw - 300px))',
        background: COLOR.bg, zIndex: 2, display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header — breadcrumb doubles as the altitude meter */}
      <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {open ? (
          <button onClick={() => setOpen(null)} aria-label="Tillbaka till Sverige"
            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 2,
              WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
            <ChevronLeft size={15} color={COLOR.ink3} />
            <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3 }}>Sverige</span>
          </button>
        ) : (
          <Link href="/schema/atlas" style={{ display: 'flex', alignItems: 'center', gap: 2,
            textDecoration: 'none', padding: 4 }}>
            <ChevronLeft size={15} color={COLOR.ink4} />
            <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink4 }}>Atlas</span>
          </Link>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: COLOR.ink4 }}>
          {open ? open.name.toUpperCase() : 'KARTAN · SVERIGE'}
        </span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, color: COLOR.ink3 }}>Laddar kartan…</span>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <AnimatePresence mode="popLayout" initial={false}>
            {open == null ? (
              <motion.div key="sverige" style={{ height: '100%' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SverigeMosaic
                  divisions={divisions}
                  datesByDivision={datesByDivision}
                  onOpen={setOpen}
                />
              </motion.div>
            ) : (
              <motion.div key={'div-' + open.id} style={{ height: '100%' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DivisionSquares division={open} onClose={() => setOpen(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
