'use client'

// Atlas — the season as a zoomable map. The terrain is the calendar itself:
// one GitHub-style grid per month, laid out on a canvas you pan and pinch like
// Google Earth. Level-of-detail: year → month → day → matches. A pin anchors
// you (today by default, or drop it anywhere) and stays visible at every zoom.

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName } from '@/lib/utils'
import { divisionTier, divisionColor, hexAlpha } from '@/lib/divisions'
import { TAV_MAP, type Tavling } from '@/lib/tavlingar'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'

const GOLD = '#f5c200'
const MONTHS   = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
const MONTHS_S = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const DOW      = ['M', 'T', 'O', 'T', 'F', 'L', 'S']
const DAYS     = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

// ── Canvas geometry (design units, scaled by the zoom transform) ─────────────
const CELL = 26, GAP = 3
const MONTH_PAD = 10, TITLE_H = 24, DOW_H = 16
const GRID_W  = 7 * CELL + 6 * GAP
const MONTH_W = MONTH_PAD * 2 + GRID_W
const MONTH_H = MONTH_PAD * 2 + TITLE_H + DOW_H + 6 * CELL + 5 * GAP
const COLS = 3, COL_GAP = 20, ROW_GAP = 20

type Team = { id: string; name: string }
type Match = {
  id: string; date: string; status: string; round: number
  home_score: number | null; away_score: number | null
  venue: string; division: string
  home_team_id: string; away_team_id: string
  home: Team; away: Team
}
type DayInfo = { count: number; color: string; live: boolean; tav: boolean; tier: number }

function monthKeys(from: string, to: string): string[] {
  const out: string[] = []
  let [y, m] = [+from.slice(0, 4), +from.slice(5, 7)]
  const [ey, em] = [+to.slice(0, 4), +to.slice(5, 7)]
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m++; if (m > 12) { m = 1; y++ }
  }
  return out
}
// Mon-first weekday index of the 1st of a month
function firstDow(mo: string): number {
  return (new Date(mo + '-01T12:00:00').getDay() + 6) % 7
}
function daysInMonth(mo: string): number {
  const [y, m] = [+mo.slice(0, 4), +mo.slice(5, 7)]
  return new Date(y, m, 0).getDate()
}

export default function AtlasPage() {
  const { theme } = useTheme()
  const C      = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [dayOpen, setDayOpen] = useState<string | null>(null)
  const [pin, setPin] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bk-atlas-pin')
      if (saved) return saved
    }
    return new Date().toISOString().slice(0, 10)
  })

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select('*, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
      .not('round', 'is', null)
      .order('date')
      .then(({ data }) => {
        if (data) setMatches(data as unknown as Match[])
        setLoading(false)
      })
  }, [])

  // ── World model: months + per-day info ─────────────────────────────────────
  const model = useMemo(() => {
    const dates = [...matches.map(m => m.date.slice(0, 10)), ...TAV_MAP.keys(), today].sort()
    const months = monthKeys(dates[0].slice(0, 7), dates[dates.length - 1].slice(0, 7))

    const days = new Map<string, DayInfo>()
    let maxCount = 1
    matches.forEach(m => {
      const d = m.date.slice(0, 10)
      const tier = divisionTier(m.division)
      const cur = days.get(d) ?? { count: 0, color: divisionColor(m.division), live: false, tav: false, tier }
      cur.count++
      if (m.status === 'live') cur.live = true
      if (tier < cur.tier) { cur.tier = tier; cur.color = divisionColor(m.division) }
      days.set(d, cur)
      if (cur.count > maxCount) maxCount = cur.count
    })
    TAV_MAP.forEach((_, d) => {
      const cur = days.get(d) ?? { count: 0, color: GOLD, live: false, tav: false, tier: 9 }
      cur.tav = true
      days.set(d, cur)
    })

    const rows = Math.ceil(months.length / COLS)
    const worldW = COLS * MONTH_W + (COLS - 1) * COL_GAP
    const worldH = rows * MONTH_H + (rows - 1) * ROW_GAP
    return { months, days, maxCount, worldW, worldH }
  }, [matches, today])

  const monthOrigin = (idx: number) => ({
    x: (idx % COLS) * (MONTH_W + COL_GAP),
    y: Math.floor(idx / COLS) * (MONTH_H + ROW_GAP),
  })
  // Canvas-space center of a date's cell
  const cellCenter = (date: string) => {
    const idx = model.months.indexOf(date.slice(0, 7))
    if (idx < 0) return null
    const o = monthOrigin(idx)
    const slot = firstDow(date.slice(0, 7)) + (+date.slice(8, 10) - 1)
    return {
      x: o.x + MONTH_PAD + (slot % 7) * (CELL + GAP) + CELL / 2,
      y: o.y + MONTH_PAD + TITLE_H + DOW_H + Math.floor(slot / 7) * (CELL + GAP) + CELL / 2,
    }
  }

  // ── The camera: pan/zoom via motion values ──────────────────────────────────
  const viewRef  = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const s = useMotionValue(1)
  const [vp, setVp] = useState({ w: 0, h: 0 })
  const [lod, setLod] = useState<'year' | 'month' | 'day'>('month')
  const initRef = useRef(false)

  useEffect(() => {
    const el = viewRef.current
    if (!el) return
    const measure = () => setVp({ w: el.clientWidth, h: el.clientHeight })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [loading])

  const minScale = vp.w > 0
    ? Math.min(vp.w / (model.worldW + 40), vp.h / (model.worldH + 40))
    : 0.3
  const maxScale = 2.6
  const clampS = (v: number) => Math.max(minScale, Math.min(maxScale, v))

  // LOD from effective cell size on screen
  useEffect(() => {
    const update = (v: number) => {
      const px = v * CELL
      const next = px < 13 ? 'year' : px < 30 ? 'month' : 'day'
      setLod(prev => (prev === next ? prev : next))
    }
    update(s.get())
    return s.on('change', update)
  }, [s])

  const clampPan = (nx: number, ny: number, sc: number) => {
    const pad = 60
    const minX = Math.min(pad, vp.w - model.worldW * sc - pad)
    const minY = Math.min(pad, vp.h - model.worldH * sc - pad)
    return {
      x: Math.max(minX, Math.min(pad, nx)),
      y: Math.max(minY, Math.min(pad, ny)),
    }
  }

  // Fly the camera so canvas point (cx, cy) sits at viewport center, at scale ts
  const flyTo = (cx: number, cy: number, ts: number) => {
    const sc = clampS(ts)
    const t = clampPan(vp.w / 2 - cx * sc, vp.h / 2.4 - cy * sc, sc)
    const spring = { type: 'spring', stiffness: 170, damping: 26 } as const
    animate(s, sc, spring); animate(x, t.x, spring); animate(y, t.y, spring)
  }
  const flyToDate = (date: string, ts?: number) => {
    const c = cellCenter(date)
    if (c) flyTo(c.x, c.y, ts ?? Math.max(vp.w / (MONTH_W + 30), 1.1))
  }
  const flyToYear = () => flyTo(model.worldW / 2, model.worldH / 2, minScale)

  // Initial view: month zoom centered on the pin
  useEffect(() => {
    if (loading || vp.w === 0 || initRef.current) return
    initRef.current = true
    const sc = clampS(Math.max(vp.w / (MONTH_W + 30), 1.1))
    const c = cellCenter(pin) ?? { x: model.worldW / 2, y: model.worldH / 2 }
    const t = clampPan(vp.w / 2 - c.x * sc, vp.h / 2.4 - c.y * sc, sc)
    s.set(sc); x.set(t.x); y.set(t.y)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, vp.w])

  // ── Gestures: drag pan, pinch zoom, wheel zoom, tap ─────────────────────────
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture  = useRef({ moved: false, startDist: 0, startScale: 1 })

  const zoomAround = (px: number, py: number, nextS: number) => {
    const sc = clampS(nextS)
    const k = sc / s.get()
    const t = clampPan(px - (px - x.get()) * k, py - (py - y.get()) * k, sc)
    s.set(sc); x.set(t.x); y.set(t.y)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    gesture.current.moved = false
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current.startDist = Math.hypot(a.x - b.x, a.y - b.y)
      gesture.current.startScale = s.get()
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const cur = { x: e.clientX, y: e.clientY }
    if (pointers.current.size === 1) {
      const dx = cur.x - prev.x, dy = cur.y - prev.y
      if (Math.abs(dx) + Math.abs(dy) > 3) gesture.current.moved = true
      const t = clampPan(x.get() + dx, y.get() + dy, s.get())
      x.set(t.x); y.set(t.y)
    }
    pointers.current.set(e.pointerId, cur)
    if (pointers.current.size === 2) {
      gesture.current.moved = true
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (gesture.current.startDist > 0) {
        const rect = viewRef.current!.getBoundingClientRect()
        zoomAround((a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top,
          gesture.current.startScale * (dist / gesture.current.startDist))
      }
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size > 0 || gesture.current.moved) return
    // Tap: day cell → open day (or zoom to month first when far out)
    const target = (e.target as Element).closest('[data-date], [data-month]')
    if (!target) return
    const date  = target.getAttribute('data-date')
    const month = target.getAttribute('data-month')
    if (date) {
      if (lod === 'year') flyToDate(date)
      else if (model.days.has(date)) setDayOpen(date)
      else flyToDate(date)
    } else if (month) {
      flyToDate(month + '-15')
    }
  }

  useEffect(() => {
    const el = viewRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      zoomAround(e.clientX - rect.left, e.clientY - rect.top, s.get() * Math.exp(-e.deltaY * 0.0016))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, vp.w, minScale])

  // Pin stays constant size on screen: counter-scale
  const pinScale = useTransform(s, v => 1 / v)

  const dropPin = (date: string) => {
    setPin(date)
    localStorage.setItem('bk-atlas-pin', date)
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted }}>Laddar atlas...</div>
    </main>
  )

  const pinPos = cellCenter(pin)
  const dayMatches = dayOpen
    ? matches.filter(m => m.date.slice(0, 10) === dayOpen)
        .sort((a, b) => divisionTier(a.division) - divisionTier(b.division) || a.date.localeCompare(b.date))
    : []
  const dayTavs: Tavling[] = dayOpen ? (TAV_MAP.get(dayOpen) ?? []) : []

  const fmtDay = (d: string) => {
    const dt = new Date(d + 'T12:00:00')
    return `${DAYS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main style={{ height: '100dvh', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* Control bar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
        padding: '66px 14px 8px', borderBottom: '1px solid ' + C.border, zIndex: 20, background: C.bg }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: C.textMuted }}>ATLAS</span>
        <span style={{ fontSize: 9, color: C.textMuted }}>
          {lod === 'year' ? 'Säsong' : lod === 'month' ? 'Månad' : 'Dag'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={flyToYear} aria-label="Zooma ut till säsong"
            style={{ border: '1px solid ' + C.border, background: 'transparent', color: C.textMuted,
              borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent' } as any}>
            Säsong
          </button>
          <button onClick={() => flyToDate(pin)} aria-label="Flyg till nålen"
            style={{ border: `1px solid ${hexAlpha(GOLD, 0.5)}`, background: hexAlpha(GOLD, 0.1),
              color: C.text, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 800,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as any}>
            📍 {pin === today ? 'Idag' : `${+pin.slice(8, 10)} ${MONTHS_S[+pin.slice(5, 7) - 1]}`}
          </button>
        </div>
      </div>

      {/* ── The map viewport ──────────────────────────────────────────────────── */}
      <div ref={viewRef}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', touchAction: 'none',
          cursor: 'grab' }}>

        <motion.div style={{ x, y, scale: s, transformOrigin: '0 0', position: 'absolute',
          width: model.worldW, height: model.worldH }}>

          {model.months.map((mo, idx) => {
            const o = monthOrigin(idx)
            const dim  = daysInMonth(mo)
            const off  = firstDow(mo)
            const isCurMonth = mo === today.slice(0, 7)
            return (
              <div key={mo} data-month={mo}
                style={{ position: 'absolute', left: o.x, top: o.y, width: MONTH_W, height: MONTH_H,
                  borderRadius: 12, background: C.surface,
                  border: `1px solid ${isCurMonth ? hexAlpha(GOLD, 0.45) : C.border}`,
                  boxShadow: isCurMonth ? `0 0 14px ${hexAlpha(GOLD, 0.12)}` : 'none',
                  padding: MONTH_PAD }}>
                <div style={{ height: TITLE_H, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
                    {MONTHS[+mo.slice(5, 7) - 1]}
                  </span>
                  <span style={{ fontSize: 10, color: C.textMuted }}>{mo.slice(0, 4)}</span>
                </div>
                <div style={{ height: DOW_H, display: 'flex', gap: GAP }}>
                  {DOW.map((d, i) => (
                    <span key={i} style={{ width: CELL, fontSize: 8.5, fontWeight: 700,
                      color: C.textMuted, textAlign: 'center' }}>
                      {lod !== 'year' ? d : ''}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: GAP, width: GRID_W }}>
                  {Array.from({ length: 42 }, (_, slot) => {
                    const dayNum = slot - off + 1
                    if (dayNum < 1 || dayNum > dim)
                      return <div key={slot} style={{ width: CELL, height: CELL }} />
                    const date = `${mo}-${String(dayNum).padStart(2, '0')}`
                    const info = model.days.get(date)
                    const isPast  = date < today
                    const isToday = date === today
                    const intensity = info ? 0.3 + 0.7 * Math.min(info.count / model.maxCount, 1) : 0
                    const bg = info && info.count > 0
                      ? (info.color.startsWith('#')
                          ? hexAlpha(info.color, intensity * (isPast ? 0.4 : 1))
                          : info.color)
                      : info?.tav
                        ? hexAlpha(GOLD, isPast ? 0.25 : 0.5)
                        : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    return (
                      <div key={slot} data-date={date}
                        style={{ width: CELL, height: CELL, borderRadius: 5, background: bg,
                          position: 'relative', cursor: info ? 'pointer' : 'default',
                          outline: isToday ? `1.5px solid ${GOLD}` : 'none', outlineOffset: 1,
                          boxShadow: info?.live ? `0 0 7px ${hexAlpha(GOLD, 0.8)}` : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {lod === 'day' && (
                          <span style={{ fontSize: 8, fontWeight: 700, pointerEvents: 'none',
                            color: info && info.count > 0
                              ? (isDark ? '#fff' : '#1a2535')
                              : C.textMuted,
                            opacity: info && info.count > 0 ? 0.95 : 0.5 }}>
                            {info && info.count > 0 ? info.count : dayNum}
                          </span>
                        )}
                        {info?.tav && info.count > 0 && (
                          <div style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5,
                            borderRadius: 1, transform: 'rotate(45deg)', background: GOLD,
                            pointerEvents: 'none' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* The pin — counter-scaled so it stays the same size at every altitude */}
          {pinPos && (
            <motion.div style={{ position: 'absolute', left: pinPos.x, top: pinPos.y,
              scale: pinScale, transformOrigin: '50% 100%', pointerEvents: 'none', zIndex: 5,
              x: '-50%', y: '-100%' }}>
              <svg width="26" height="34" viewBox="0 0 26 34">
                <path d="M13 0C5.8 0 0 5.8 0 13c0 9.8 13 21 13 21s13-11.2 13-21C26 5.8 20.2 0 13 0z"
                  fill={GOLD} stroke={isDark ? '#10161e' : '#fff'} strokeWidth="2" />
                <circle cx="13" cy="12.5" r="4.5" fill={isDark ? '#10161e' : '#fff'} />
              </svg>
            </motion.div>
          )}
        </motion.div>

        {/* Zoom buttons */}
        <div style={{ position: 'absolute', right: 12, bottom: 110, display: 'flex',
          flexDirection: 'column', gap: 8, zIndex: 10 }}>
          {(['+', '−'] as const).map(op => (
            <button key={op} aria-label={op === '+' ? 'Zooma in' : 'Zooma ut'}
              onClick={() => zoomAround(vp.w / 2, vp.h / 2, s.get() * (op === '+' ? 1.55 : 0.65))}
              style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid ' + C.border,
                background: C.surface, color: C.text, fontSize: 18, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                WebkitTapHighlightColor: 'transparent' } as any}>
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* ── Day sheet — the deepest zoom: matches ─────────────────────────────── */}
      <AnimatePresence>
        {dayOpen && (
          <>
            <motion.div key="sheet-bd" onClick={() => setDayOpen(null)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 80,
                background: isDark ? 'rgba(6,10,16,0.6)' : 'rgba(26,37,53,0.35)' }} />
            <motion.div key="sheet"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 81,
                maxWidth: 600, margin: '0 auto', maxHeight: '62dvh', overflowY: 'auto',
                background: C.surface, borderRadius: '18px 18px 0 0',
                border: '1px solid ' + C.border, borderBottom: 'none',
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border,
                margin: '8px auto 4px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 4px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{fmtDay(dayOpen)}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>
                    {dayMatches.length > 0 && `${dayMatches.length} matcher`}
                    {dayMatches.length > 0 && dayTavs.length > 0 && ' · '}
                    {dayTavs.length > 0 && `${dayTavs.length} ${dayTavs.length === 1 ? 'tävling' : 'tävlingar'}`}
                  </div>
                </div>
                <button onClick={() => { dropPin(dayOpen); }}
                  style={{ border: `1px solid ${hexAlpha(GOLD, 0.5)}`,
                    background: pin === dayOpen ? hexAlpha(GOLD, 0.18) : 'transparent',
                    color: C.text, borderRadius: 20, padding: '4px 12px', fontSize: 11,
                    fontWeight: 700, cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent' } as any}>
                  📍 {pin === dayOpen ? 'Nålen sitter här' : 'Fäst nålen'}
                </button>
              </div>

              {dayTavs.map(t => (
                <a key={t.id} href={t.href}
                  style={{ display: 'block', margin: '8px 16px 0', padding: '10px 12px',
                    borderRadius: 10, textDecoration: 'none',
                    background: hexAlpha(GOLD, isDark ? 0.07 : 0.05),
                    border: `1px solid ${hexAlpha(GOLD, 0.25)}`,
                    WebkitTapHighlightColor: 'transparent' } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                    {t.dateLabel} · {t.venue}
                  </div>
                </a>
              ))}

              {dayMatches.map(m => {
                const done    = m.home_score !== null
                const live    = m.status === 'live'
                const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
                const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
                const color   = divisionColor(m.division)
                return (
                  <a key={m.id} href={'/matches/' + m.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
                      textDecoration: 'none', WebkitTapHighlightColor: 'transparent' } as any}>
                    <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2,
                      background: hexAlpha(color, 0.7) }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 8.5, fontWeight: 700, color, letterSpacing: 0.5 }}>
                        {m.division.toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13, textAlign: 'right',
                          fontWeight: homeWin ? 700 : 400,
                          color: done && !homeWin ? C.textMuted : C.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {shortName(m.home?.name || '')}
                        </span>
                        <span style={{ flexShrink: 0, width: 52, textAlign: 'center',
                          fontSize: live || done ? 13 : 10, fontWeight: live || done ? 900 : 600,
                          color: live ? '#e05555' : done ? C.text : C.textMuted }}>
                          {live || done
                            ? `${m.home_score}–${m.away_score}`
                            : new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13,
                          fontWeight: awayWin ? 700 : 400,
                          color: done && !awayWin ? C.textMuted : C.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {shortName(m.away?.name || '')}
                        </span>
                      </div>
                    </div>
                  </a>
                )
              })}

              <div style={{ padding: '10px 16px' }}>
                <a href={'/schema?date=' + dayOpen}
                  style={{ fontSize: 12, fontWeight: 700, color: C.accent, textDecoration: 'none' }}>
                  Öppna dagen i schemat →
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
