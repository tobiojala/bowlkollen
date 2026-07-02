'use client'

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useUserSeasonMatches, useAllDivisions, useDivisionMatches } from '@/lib/queries'
import { PulsHero } from './_components/PulsHero'
import { PulsPeekOverlay } from './_components/PulsPeekOverlay'
import type { ArcWeek } from './_components/SeasonWeekline'
import { ScopeBanner } from './_components/ScopeBanner'
import { SeasonStatusScreen } from './_components/SeasonStatusScreen'
import { WeekGroupSection } from './_components/WeekGroupSection'
import type { WeekGroup } from './_components/WeekGroupSection'
import { isoWeekStart } from './_components/week'
import type { Match } from './_components/types'
import { useColors } from '@/components/ThemeProvider'

const today = new Date().toISOString().slice(0, 10)
const NAV_H = 56

function SchemaPageInner() {
  const { C } = useColors()
  const router = useRouter()
  const searchParams  = useSearchParams()
  const weekParam     = searchParams.get('week')
  const divisionParam = searchParams.get('division')

  const [selectedDivision, setSelectedDivision] = useState<{ id: number; name: string } | null>(null)
  const { data: userMatches = [], isLoading: userLoading } = useUserSeasonMatches()
  const { data: divisionMatches = [], isLoading: divisionLoading } = useDivisionMatches(selectedDivision?.id ?? null)
  const { data: allDivisions = [], isLoading: divisionsLoading } = useAllDivisions()
  const matches = selectedDivision ? divisionMatches : userMatches
  const loading = selectedDivision ? divisionLoading : userLoading
  const isPersonalized = selectedDivision ? false : (matches[0]?.isPersonalized ?? true)
  const [mode,       setMode]       = useState<'feed' | 'peek'>('feed')
  const [activeWeek, setActiveWeek] = useState<string | null>(null)

  const scrollRef      = useRef<HTMLDivElement>(null)
  const isProgrammatic = useRef(false)
  const pinchRef       = useRef<{ dist: number } | null>(null)

  // A division picked on the Atlas page arrives as a query param — adopt it
  // once the division list has loaded enough to resolve its name.
  useEffect(() => {
    if (!divisionParam || divisionsLoading) return
    const id = Number(divisionParam)
    const d = allDivisions.find(d => d.bits_division_id === id)
    if (d) setSelectedDivision({ id: d.bits_division_id, name: d.name })
  }, [divisionParam, divisionsLoading, allDivisions])

  const { grouped, upcoming, past, arcWeeks, currentWeek } = useMemo(() => {
    const byWeek = new Map<string, { byDate: Map<string, Match[]>; hasLive: boolean }>()
    for (const m of matches) {
      const wk = isoWeekStart(m.matchDate.slice(0, 10))
      if (!byWeek.has(wk)) byWeek.set(wk, { byDate: new Map(), hasLive: false })
      const wd = byWeek.get(wk)!
      const dk = m.matchDate.slice(0, 10)
      if (!wd.byDate.has(dk)) wd.byDate.set(dk, [])
      wd.byDate.get(dk)!.push(m)
    }
    const grouped: WeekGroup[] = [...byWeek.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekKey, { byDate, hasLive }]) => ({
        weekKey, hasLive,
        dates: [...byDate.entries()].sort().map(([date, ms]) => ({ date, matches: ms })),
      }))
    const arcWeeks: ArcWeek[] = grouped.map(g => ({
      weekKey: g.weekKey,
      count:   g.dates.reduce((s, d) => s + d.matches.length, 0),
      hasLive: g.hasLive,
    }))
    const currentWeek = isoWeekStart(today)
    // Today-forward sits right under the hero, no scroll needed — recent
    // results (still fully reachable, just not the first thing you hit)
    // live in a "Tidigare" section below, most recent first.
    const upcoming = grouped.filter(g => g.weekKey >= currentWeek)
    const past      = grouped.filter(g => g.weekKey < currentWeek).reverse()
    return { grouped, upcoming, past, arcWeeks, currentWeek }
  }, [matches])

  const SCROLL_OFFSET = NAV_H + 12

  const scrollToWeek = useCallback((weekKey: string, behavior: ScrollBehavior = 'smooth') => {
    const el = document.getElementById(`week-${weekKey}`)
    if (!el || !scrollRef.current) return
    isProgrammatic.current = true
    const container = scrollRef.current
    const top = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - SCROLL_OFFSET
    container.scrollTo({ top: Math.max(0, top), behavior })
    setTimeout(() => { isProgrammatic.current = false }, 700)
  }, [SCROLL_OFFSET])

  // The hero is the landing view — no auto-scroll on a fresh open, today
  // forward is already the first thing under it. Only an explicit deep link
  // from the Atlas page (a week param) jumps the feed programmatically.
  useEffect(() => {
    if (loading || grouped.length === 0 || !weekParam) return
    if (!grouped.some(g => g.weekKey === weekParam)) return
    setActiveWeek(weekParam)
    setTimeout(() => scrollToWeek(weekParam, 'instant'), 50)
  }, [loading, grouped.length, selectedDivision?.id, weekParam]) // eslint-disable-line react-hooks/exhaustive-deps

  // Highlights the hero's "today" tick correctly even before any scrolling.
  useEffect(() => {
    if (!weekParam) setActiveWeek(currentWeek)
  }, [currentWeek]) // eslint-disable-line react-hooks/exhaustive-deps

  // IntersectionObserver — track which week header is at top of viewport.
  // Observing starts after a delay matching the initial auto-scroll's settle
  // window (see effect above) — otherwise the observer's first report
  // (fired immediately on observe(), before the scroll happens) reflects
  // the pre-scroll top-of-page state and overwrites the correct activeWeek.
  useEffect(() => {
    if (!scrollRef.current || !grouped.length) return
    const root = scrollRef.current
    const obs = new IntersectionObserver(entries => {
      if (isProgrammatic.current) return
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length > 0) {
        const w = visible[0].target.getAttribute('data-week')
        if (w) setActiveWeek(w)
      }
    }, { root, rootMargin: `-${NAV_H}px 0px -50% 0px`, threshold: 0 })
    const startTimer = setTimeout(() => {
      root.querySelectorAll('[data-week]').forEach(el => obs.observe(el))
    }, 800)
    return () => { clearTimeout(startTimer); obs.disconnect() }
  }, [grouped])

  // The top nav's own SchemaNavRecall (rendered globally in Nav.tsx) tracks
  // hero visibility itself via the bk-scroll event below — this just listens
  // for the tap on it, to recall the hero without losing scroll position.
  useEffect(() => {
    const onRecall = () => setMode('peek')
    window.addEventListener('bk-schema-recall', onRecall)
    return () => window.removeEventListener('bk-schema-recall', onRecall)
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { dist: Math.hypot(dx, dy) }
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchRef.current) return
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    if (Math.hypot(dx, dy) / pinchRef.current.dist < 0.75) {
      pinchRef.current = null
      router.push('/schema/atlas')
    }
  }, [router])

  if (loading) return <SeasonStatusScreen variant="loading" C={C} />

  // get_user_season_matches() always falls back to Elitserien when you
  // follow nobody — this only fires if even that comes back empty (RPC
  // error, or Elitserien temporarily has no scheduled matches), or if an
  // explicitly browsed division has no matches scheduled this season.
  if (matches.length === 0) return (
    <SeasonStatusScreen
      variant="empty"
      C={C}
      selectedDivision={selectedDivision}
      onClearDivision={() => setSelectedDivision(null)}
    />
  )

  const scopeTitle = selectedDivision ? selectedDivision.name : isPersonalized ? 'Din säsong' : 'Elitserien'

  return (
    <div
      style={{ position: 'fixed', top: 0, bottom: 0, left: 'max(0px, calc(50vw - 300px))', right: 'max(0px, calc(50vw - 300px))', background: C.bg, zIndex: 2 }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <AnimatePresence>
        {mode === 'peek' && (
          <motion.div
            key="peek"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <PulsPeekOverlay
              weeks={arcWeeks}
              currentWeek={currentWeek}
              activeWeek={activeWeek}
              title={scopeTitle}
              onHairlineCommit={scrollToWeek}
              onClose={() => setMode('feed')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={(e) => window.dispatchEvent(
          new CustomEvent('bk-scroll', { detail: { y: e.currentTarget.scrollTop } })
        )}
        style={{
          height: '100%',
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          paddingTop: NAV_H,
          paddingBottom: 96,
        } as React.CSSProperties}
      >
        {/* Puls — the hero, first thing you see on Schema, not a list */}
        <PulsHero
          title={scopeTitle}
          weeks={arcWeeks}
          currentWeek={currentWeek}
          activeWeek={activeWeek}
          onHairlineCommit={scrollToWeek}
          onOpenAtlas={() => router.push('/schema/atlas')}
        />

        <ScopeBanner
          selectedDivision={selectedDivision}
          isPersonalized={isPersonalized}
          onClearDivision={() => setSelectedDivision(null)}
        />

        {upcoming.map(g => (
          <WeekGroupSection key={g.weekKey} group={g} currentWeek={currentWeek} activeWeek={activeWeek} />
        ))}

        {past.length > 0 && (
          <>
            <div style={{ padding: '24px 20px 4px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: C.textMuted }}>
                Tidigare
              </span>
            </div>
            {past.map(g => (
              <WeekGroupSection key={g.weekKey} group={g} currentWeek={currentWeek} activeWeek={activeWeek} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default function SchemaPage() {
  return (
    <Suspense>
      <SchemaPageInner />
    </Suspense>
  )
}
