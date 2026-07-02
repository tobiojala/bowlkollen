'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutGrid, Map as MapIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { COLOR } from '@/lib/brand'
import { useSeasonMatchDates, useAllDivisions } from '@/lib/queries'
import { groupDivisionsByTier, divisionTier, TIER_COLOR } from '@/lib/division-standings'
import { usePinnedDate, PinGlyph } from '@/app/schema/_components/pin'
import { AtlasCarousel } from './_components/AtlasCarousel'
import type { AtlasCarouselHandle } from './_components/AtlasCarousel'
import { AtlasSlide } from './_components/AtlasSlide'
import type { Altitude } from './_components/AtlasSlide'
import { DivisionMapView } from './_components/DivisionMapView'

const NAV_H = 56
const MONTH_SE = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const todayStr = new Date().toISOString().slice(0, 10)

export default function AtlasPage() {
  const router = useRouter()
  const { data: rows = [], isLoading: datesLoading } = useSeasonMatchDates()
  const { data: divisions = [], isLoading: divisionsLoading } = useAllDivisions()
  const [activeIndex, setActiveIndex] = useState(0)
  const [mapMode, setMapMode] = useState(false)
  // The camera's altitude — shared across slides, so swiping between
  // divisions keeps your height. Karta (mapMode) is the level above 'year'.
  const [altitude, setAltitude] = useState<Altitude>('month')
  const [pin, setPin] = usePinnedDate()
  const [flyToPinNonce, setFlyToPinNonce] = useState(0)
  const carouselRef = useRef<AtlasCarouselHandle>(null)

  const orderedDivisions = useMemo(() => [...groupDivisionsByTier(divisions).values()].flat(), [divisions])

  const datesByDivision = useMemo(() => {
    const m = new Map<number, string[]>()
    for (const r of rows) {
      const arr = m.get(r.bits_division_id)
      if (arr) arr.push(r.match_date); else m.set(r.bits_division_id, [r.match_date])
    }
    return m
  }, [rows])

  const seasonMonths = useMemo(() => {
    if (rows.length === 0) return []
    const sorted = [...rows].sort((a, b) => a.match_date.localeCompare(b.match_date))
    const start  = new Date(sorted[0].match_date + 'T12:00:00')
    const end    = new Date(sorted[sorted.length - 1].match_date + 'T12:00:00')
    const months: { year: number; month: number }[] = []
    const cur    = new Date(start.getFullYear(), start.getMonth(), 1)
    const last   = new Date(end.getFullYear(), end.getMonth(), 1)
    while (cur <= last) {
      months.push({ year: cur.getFullYear(), month: cur.getMonth() })
      cur.setMonth(cur.getMonth() + 1)
    }
    return months
  }, [rows])

  const slides = useMemo(() => [
    { id: 'sverige', title: 'Sverige', dates: rows.map(r => r.match_date), divisionId: null as number | null, accent: undefined as string | undefined },
    ...orderedDivisions.map(d => ({
      id: String(d.bits_division_id), title: d.name,
      dates: datesByDivision.get(d.bits_division_id) ?? [], divisionId: d.bits_division_id,
      accent: TIER_COLOR[divisionTier(d.name)],
    })),
  ], [rows, orderedDivisions, datesByDivision])

  const goToIndex = (i: number) => {
    if (i < 0 || i >= slides.length) return
    carouselRef.current?.scrollToIndex(i)
    setActiveIndex(i)
  }

  const commitWeek = (weekKey: string, divisionId: number | null) => {
    // The pin follows you into the feed — coming back to the Atlas,
    // it marks where the journey started.
    setPin(weekKey)
    const params = new URLSearchParams({ week: weekKey })
    if (divisionId != null) params.set('division', String(divisionId))
    router.push(`/schema?${params.toString()}`)
  }

  const selectFromMap = (divisionId: number) => {
    const idx = slides.findIndex(s => s.divisionId === divisionId)
    if (idx >= 0) goToIndex(idx)
    setMapMode(false)
    // Descending from the Karta lands at the year altitude — one rung
    // down, not a two-level jump straight into a month.
    setAltitude('year')
  }

  const flyToPin = () => {
    setAltitude('month')
    setFlyToPinNonce(n => n + 1)
    setMapMode(false)
  }

  const loading = datesLoading || divisionsLoading
  const activeDivisionId = slides[activeIndex]?.divisionId ?? null

  const pinLabel = pin === todayStr
    ? 'Idag'
    : `${+pin.slice(8, 10)} ${MONTH_SE[+pin.slice(5, 7) - 1]}`

  return (
    <div
      style={{
        position: 'fixed', top: NAV_H, bottom: 0,
        left: 'max(0px, calc(50vw - 300px))', right: 'max(0px, calc(50vw - 300px))',
        background: COLOR.bg, zIndex: 2, display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        {mapMode ? (
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: COLOR.ink4 }}>KARTA</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => goToIndex(activeIndex - 1)} aria-label="Föregående"
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
              <ChevronLeft size={16} color={COLOR.ink4} />
            </button>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: COLOR.ink4 }}>
              {slides.length > 0 ? `${activeIndex + 1} / ${slides.length}` : ''}
            </span>
            <button onClick={() => goToIndex(activeIndex + 1)} aria-label="Nästa"
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
              <ChevronRight size={16} color={COLOR.ink4} />
            </button>

            {/* Altitude — tap to toggle without pinching */}
            <button onClick={() => setAltitude(a => (a === 'month' ? 'year' : 'month'))}
              aria-label="Byt zoomnivå"
              style={{ background: COLOR.surface, border: 'none', borderRadius: 100,
                padding: '4px 10px', fontSize: 10, fontWeight: 800, letterSpacing: 1,
                color: COLOR.ink3, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
              {altitude === 'month' ? 'MÅNAD' : 'ÅR'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Pin chip — fly home at any altitude */}
          {!mapMode && (
            <button onClick={flyToPin} aria-label="Flyg till nålen"
              style={{ background: 'none', border: '1px solid rgba(245,194,0,0.35)',
                borderRadius: 100, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
              <PinGlyph size={9} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: COLOR.ink2 }}>
                {pinLabel}
              </span>
            </button>
          )}

          <Link href="/schema/atlas/karta" aria-label="Öppna Kartan"
            style={{ display: 'flex', padding: 4 }}>
            <MapIcon size={17} color={COLOR.ink4} />
          </Link>

          <button
            onClick={() => setMapMode(v => !v)}
            style={{
              background: mapMode ? COLOR.surface2 : 'none', border: 'none',
              borderRadius: 100, padding: mapMode ? '6px 12px' : 4,
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            } as React.CSSProperties}
            aria-label={mapMode ? 'Stäng karta' : 'Öppna karta'}
          >
            {mapMode
              ? <X size={15} color={COLOR.ink} />
              : <LayoutGrid size={18} color={COLOR.ink4} />}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, color: COLOR.ink3 }}>Laddar atlas…</span>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {/* Carousel — always mounted so scroll position is preserved */}
          <div style={{ height: '100%', pointerEvents: mapMode ? 'none' : 'auto' }}>
            <AtlasCarousel ref={carouselRef} onIndexChange={setActiveIndex}>
              {slides.map((s, i) => (
                <AtlasSlide
                  key={s.id}
                  title={s.title}
                  count={s.dates.length}
                  dates={s.dates}
                  months={seasonMonths}
                  accent={s.accent}
                  isActive={Math.abs(i - activeIndex) <= 1}
                  altitude={altitude}
                  onAltitude={setAltitude}
                  onExitToMap={() => setMapMode(true)}
                  pinDate={pin}
                  flyToPinNonce={flyToPinNonce}
                  onCommitWeek={(weekKey) => commitWeek(weekKey, s.divisionId)}
                />
              ))}
            </AtlasCarousel>
          </div>

          {/* Map overlay — all division grids at once: the top of the zoom ladder */}
          <AnimatePresence>
            {mapMode && (
              <motion.div
                key="map"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0, background: COLOR.bg, zIndex: 5 }}
              >
                <DivisionMapView
                  divisions={divisions}
                  datesByDivision={datesByDivision}
                  seasonMonths={seasonMonths}
                  activeDivisionId={activeDivisionId}
                  onSelect={selectFromMap}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
