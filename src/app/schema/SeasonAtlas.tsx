'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Colors } from '@/lib/colors'
import { shortName } from '@/lib/utils'
import { DIVISIONS, divisionTier, divisionColor, divisionShort, hexAlpha } from '@/lib/divisions'
import { mondayOf, addDays, isoWeek, weekRangeLabel } from '@/lib/weeks'
import type { Tavling } from '@/lib/tavlingar'

const GOLD   = '#f5c200'
const SPRING = { type: 'spring', stiffness: 300, damping: 32 } as const
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const DAYS   = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']

const COL_W = 16   // week column width
const CELL  = 12   // cell square size
const ROW_H = 18   // row height

export type AtlasMatch = {
  id: string; date: string; status: string; division: string
  home_score: number | null; away_score: number | null
  home: { id: string; name: string }; away: { id: string; name: string }
}

type Row  = { key: string; label: string; color: string; owns: (division: string) => boolean }
type Cell = { count: number; live: boolean }

type Props = {
  matches: AtlasMatch[]
  tavMap: Map<string, Tavling[]>
  C: Colors
  isDark: boolean
  onJumpToDate: (date: string) => void
}

export default function SeasonAtlas({ matches, tavMap, C, isDark, onJumpToDate }: Props) {
  const [sel, setSel] = useState<{ row: string; week: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const today   = new Date().toISOString().slice(0, 10)
  const curWeek = mondayOf(today)

  const model = useMemo(() => {
    const dates = [...matches.map(m => m.date.slice(0, 10)), ...tavMap.keys()].sort()
    if (dates.length === 0) return null

    const weeks: string[] = []
    const lastWeek = mondayOf(dates[dates.length - 1])
    for (let wk = mondayOf(dates[0]); wk <= lastWeek; wk = addDays(wk, 7)) weeks.push(wk)

    const divisions = [...new Set(matches.map(m => m.division))]
    const rows: Row[] = []
    if (tavMap.size > 0)
      rows.push({ key: 'tav', label: 'Tävlingar', color: GOLD, owns: () => false })
    const regIdx = (d: string) => {
      const i = DIVISIONS.findIndex(x => x.name === d)
      return i < 0 ? 999 : i
    }
    divisions
      .filter(d => divisionTier(d) <= 2)
      .sort((a, b) => regIdx(a) - regIdx(b))
      .forEach(d => rows.push({ key: d, label: divisionShort(d), color: divisionColor(d), owns: x => x === d }))
    if (divisions.some(d => divisionTier(d) === 3))
      rows.push({ key: 'div1', label: 'Division 1', color: '#7a9e5a', owns: x => divisionTier(x) === 3 })

    const cells = new Map<string, Cell>()
    let maxCount = 1
    matches.forEach(m => {
      const row = rows.find(r => r.owns(m.division))
      if (!row) return
      const key = row.key + '|' + mondayOf(m.date.slice(0, 10))
      const c = cells.get(key) ?? { count: 0, live: false }
      c.count++
      if (m.status === 'live') c.live = true
      cells.set(key, c)
      if (c.count > maxCount) maxCount = c.count
    })
    // Tävling cells: count distinct tävlingar per week
    const tavPerWeek = new Map<string, Set<string>>()
    tavMap.forEach((ts, d) => {
      const wk = mondayOf(d)
      if (!tavPerWeek.has(wk)) tavPerWeek.set(wk, new Set())
      ts.forEach(t => tavPerWeek.get(wk)!.add(t.id))
    })
    tavPerWeek.forEach((ids, wk) => cells.set('tav|' + wk, { count: ids.size, live: false }))

    return { weeks, rows, cells, maxCount }
  }, [matches, tavMap])

  // Center the grid on the current week
  useEffect(() => {
    if (!model || !scrollRef.current) return
    const idx = model.weeks.indexOf(curWeek)
    if (idx < 0) return
    const el = scrollRef.current
    el.scrollTo({ left: Math.max(0, idx * COL_W - el.offsetWidth / 2 + COL_W / 2) })
  }, [model, curWeek])

  if (!model) return null
  const { weeks, rows, cells, maxCount } = model

  const cellId = (row: string, wk: string) => `atlas-${row}-${wk}`
  const getCell = (row: string, wk: string) => cells.get(row + '|' + wk)

  // ── Zoom panel data for selected cell ───────────────────────────────────────
  const selRow = sel ? rows.find(r => r.key === sel.row) ?? null : null
  const selMatches = sel && selRow && sel.row !== 'tav'
    ? matches
        .filter(m => selRow.owns(m.division) && mondayOf(m.date.slice(0, 10)) === sel.week)
        .sort((a, b) => a.date.localeCompare(b.date))
    : []
  const selDays: [string, AtlasMatch[]][] = []
  selMatches.forEach(m => {
    const d = m.date.slice(0, 10)
    const last = selDays[selDays.length - 1]
    if (last && last[0] === d) last[1].push(m)
    else selDays.push([d, [m]])
  })
  const selTavs: Tavling[] = []
  if (sel && sel.row === 'tav') {
    const seen = new Set<string>()
    tavMap.forEach((ts, d) => {
      if (mondayOf(d) !== sel.week) return
      ts.forEach(t => { if (!seen.has(t.id)) { seen.add(t.id); selTavs.push(t) } })
    })
  }
  const selFirstDate = sel
    ? (sel.row === 'tav'
        ? [...tavMap.keys()].filter(d => mondayOf(d) === sel.week).sort()[0]
        : selDays[0]?.[0]) ?? sel.week
    : null

  const dayLabel = (d: string) => {
    if (d === today) return 'IDAG'
    const dt = new Date(d + 'T12:00:00')
    return `${DAYS[dt.getDay()].toUpperCase()} ${dt.getDate()} ${MONTHS[dt.getMonth()].toUpperCase()}`
  }

  const emptyCellBg = isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.055)'

  return (
    <div>
      {/* ── Grid ──────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', padding: '10px 0 4px 12px' }}>

        {/* Row labels — fixed while grid scrolls */}
        <div style={{ flexShrink: 0, paddingRight: 8 }}>
          <div style={{ height: 15 }} />
          <div style={{ height: 7 }} />
          {rows.map(r => (
            <div key={r.key} style={{ height: ROW_H, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: r.color,
                transform: r.key === 'tav' ? 'rotate(45deg)' : 'none', flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, whiteSpace: 'nowrap' }}>
                {r.label}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable week grid */}
        <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', flex: 1 } as any}>
          <div style={{ width: weeks.length * COL_W }}>

            {/* Month labels */}
            <div style={{ display: 'flex', height: 15 }}>
              {weeks.map((wk, i) => {
                const m     = +wk.slice(5, 7) - 1
                const prevM = i > 0 ? +weeks[i - 1].slice(5, 7) - 1 : -1
                return (
                  <div key={wk} style={{ width: COL_W, flexShrink: 0, position: 'relative' }}>
                    {m !== prevM && (
                      <span style={{ position: 'absolute', left: 0, top: 0, fontSize: 9,
                        fontWeight: 700, color: C.textMuted, whiteSpace: 'nowrap' }}>
                        {MONTHS[m]}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Current-week tick */}
            <div style={{ display: 'flex', height: 7, alignItems: 'center' }}>
              {weeks.map(wk => (
                <div key={wk} style={{ width: COL_W, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                  {wk === curWeek && (
                    <div style={{ width: CELL, height: 3, borderRadius: 2, background: C.accent,
                      boxShadow: `0 0 4px ${hexAlpha(GOLD, 0.6)}` }} />
                  )}
                </div>
              ))}
            </div>

            {/* Cell rows */}
            {rows.map(r => (
              <div key={r.key} style={{ display: 'flex', height: ROW_H, alignItems: 'center' }}>
                {weeks.map(wk => {
                  const cell     = getCell(r.key, wk)
                  const isSel    = sel?.row === r.key && sel?.week === wk
                  const isPast   = wk < curWeek
                  const isTavRow = r.key === 'tav'

                  if (!cell) return (
                    <div key={wk} style={{ width: COL_W, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: CELL, height: CELL, borderRadius: 3.5, background: emptyCellBg }} />
                    </div>
                  )

                  // Intensity: more matches → stronger color; past weeks fade like explored land
                  const intensity = 0.3 + 0.7 * Math.min(cell.count / maxCount, 1)
                  const alpha     = isTavRow ? (isPast ? 0.4 : 1) : intensity * (isPast ? 0.38 : 1)
                  const bg        = r.color.startsWith('#')
                    ? hexAlpha(r.color, alpha)
                    : r.color

                  return (
                    <div key={wk} style={{ width: COL_W, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                      {isSel ? (
                        <div style={{ width: CELL, height: CELL, borderRadius: 3.5,
                          border: `1px dashed ${hexAlpha(r.color.startsWith('#') ? r.color : GOLD, 0.5)}` }} />
                      ) : (
                        <motion.button
                          layoutId={cellId(r.key, wk)}
                          onClick={() => setSel({ row: r.key, week: wk })}
                          whileTap={{ scale: 0.8 }}
                          aria-label={`${r.label} vecka ${isoWeek(wk)}: ${cell.count}`}
                          style={{ width: CELL, height: CELL, borderRadius: 3.5, border: 'none',
                            padding: 0, cursor: 'pointer', background: bg,
                            transform: isTavRow ? 'rotate(45deg) scale(0.82)' : 'none',
                            boxShadow: cell.live
                              ? `0 0 6px ${hexAlpha(GOLD, 0.8)}`
                              : isTavRow && !isPast ? `0 0 4px ${hexAlpha(GOLD, 0.45)}` : 'none',
                            WebkitTapHighlightColor: 'transparent' } as any}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 10px',
        fontSize: 9, color: C.textMuted }}>
        <span>Färre</span>
        {[0.3, 0.55, 0.8, 1].map(a => (
          <div key={a} style={{ width: 9, height: 9, borderRadius: 2.5,
            background: hexAlpha('#4a90d9', a), marginLeft: -6 }} />
        ))}
        <span style={{ marginLeft: -4 }}>fler matcher</span>
        <span style={{ marginLeft: 'auto' }}>Tryck på en ruta för att zooma in</span>
      </div>

      {/* ── Zoom panel — the tapped square expands into the week ─────────────── */}
      <AnimatePresence>
        {sel && selRow && (
          <>
            <motion.div key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSel(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 80,
                background: isDark ? 'rgba(6,10,16,0.72)' : 'rgba(26,37,53,0.45)' }} />

            <motion.div key="panel" layoutId={cellId(sel.row, sel.week)} transition={SPRING}
              style={{ position: 'fixed', left: 14, right: 14, top: '12%', zIndex: 81,
                maxWidth: 440, margin: '0 auto', background: C.surface, borderRadius: 16,
                border: '1px solid ' + C.border, overflow: 'hidden',
                boxShadow: '0 18px 50px rgba(0,0,0,0.4)' }}>

              <div style={{ height: 3, background: selRow.color }} />

              {/* Panel header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 10px' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2.5, background: selRow.color,
                  transform: sel.row === 'tav' ? 'rotate(45deg)' : 'none', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{selRow.label}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>
                    V.{isoWeek(sel.week)} · {weekRangeLabel(sel.week)}
                    {sel.row !== 'tav' && ` · ${selMatches.length} ${selMatches.length === 1 ? 'match' : 'matcher'}`}
                  </div>
                </div>
                <button onClick={() => setSel(null)} aria-label="Stäng"
                  style={{ border: 'none', background: 'transparent', color: C.textMuted,
                    fontSize: 16, cursor: 'pointer', padding: 4,
                    WebkitTapHighlightColor: 'transparent' } as any}>
                  ✕
                </button>
              </div>

              {/* Panel content */}
              <div style={{ maxHeight: '52vh', overflowY: 'auto', padding: '0 6px 6px' }}>
                {sel.row === 'tav'
                  ? selTavs.map(t => (
                      <a key={t.id} href={t.href}
                        style={{ display: 'block', textDecoration: 'none', padding: '10px 10px',
                          borderRadius: 10, margin: '2px 2px',
                          background: hexAlpha(GOLD, isDark ? 0.06 : 0.05),
                          border: `1px solid ${hexAlpha(GOLD, 0.2)}`,
                          WebkitTapHighlightColor: 'transparent' } as any}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                          {t.dateLabel} · {t.venue}
                        </div>
                      </a>
                    ))
                  : selDays.map(([date, ms]) => (
                      <div key={date}>
                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1,
                          color: date === today ? C.accent : C.textMuted, padding: '8px 10px 3px' }}>
                          {dayLabel(date)}
                        </div>
                        {ms.map(m => {
                          const done    = m.home_score !== null
                          const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
                          const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
                          const time    = new Date(m.date).toLocaleTimeString('sv-SE',
                            { hour: '2-digit', minute: '2-digit' })
                          return (
                            <a key={m.id} href={'/matches/' + m.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 8,
                                padding: '7px 10px', borderRadius: 8, margin: '0 2px',
                                textDecoration: 'none',
                                WebkitTapHighlightColor: 'transparent' } as any}>
                              <div style={{ flex: 1, minWidth: 0, fontSize: 12, textAlign: 'right',
                                fontWeight: homeWin ? 700 : 400,
                                color: done && !homeWin ? C.textMuted : C.text,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {shortName(m.home?.name || '')}
                              </div>
                              <div style={{ flexShrink: 0, width: 52, textAlign: 'center' }}>
                                {m.status === 'live' ? (
                                  <span style={{ fontSize: 11, fontWeight: 900, color: '#e05555' }}>
                                    {m.home_score}–{m.away_score}
                                  </span>
                                ) : done ? (
                                  <span style={{ fontSize: 12, fontWeight: 900, color: C.text }}>
                                    {m.home_score}–{m.away_score}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted }}>
                                    {time}
                                  </span>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0, fontSize: 12,
                                fontWeight: awayWin ? 700 : 400,
                                color: done && !awayWin ? C.textMuted : C.text,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {shortName(m.away?.name || '')}
                              </div>
                            </a>
                          )
                        })}
                      </div>
                    ))}
              </div>

              {/* Jump into the feed */}
              {selFirstDate && (
                <button
                  onClick={() => { onJumpToDate(selFirstDate); setSel(null) }}
                  style={{ display: 'block', width: '100%', padding: '11px 14px',
                    border: 'none', borderTop: '1px solid ' + C.border,
                    background: 'transparent', cursor: 'pointer', fontSize: 12,
                    fontWeight: 700, color: C.accent, textAlign: 'center',
                    WebkitTapHighlightColor: 'transparent' } as any}>
                  Visa veckan i schemat ↓
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
