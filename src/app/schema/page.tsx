'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName, dateLabel } from '@/lib/utils'
import { divisionTier, divisionColor, hexAlpha } from '@/lib/divisions'
import { mondayOf, isoWeek, weekRangeLabel } from '@/lib/weeks'
import { TAV_MAP, FUZZY_TAV, type Tavling } from '@/lib/tavlingar'
import SeasonAtlas from './SeasonAtlas'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ─────────────────────────────────────────────────────────────────────
type Team = { id: string; name: string }
type Match = {
  id: string; date: string; status: string; round: number
  home_score: number | null; away_score: number | null
  venue: string; division: string
  home_team_id: string; away_team_id: string
  home: Team; away: Team
}

const GOLD = '#f5c200'

function matchTime(d: string) {
  return new Date(d).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}
function cdStr(dateStr: string, now: number): string | null {
  const ms = Math.max(0, new Date(dateStr).getTime() - now)
  if (!ms) return null
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

type TierFilter    = 'all' | 'elite' | 'allsvenskan' | 'div1'
type ContentFilter = 'all' | 'liga' | 'tavlingar'

const TIER_OF: Record<Exclude<TierFilter, 'all'>, number> = { elite: 1, allsvenskan: 2, div1: 3 }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { theme } = useTheme()
  const C      = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [matches, setMatches]             = useState<Match[]>([])
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState<TierFilter>('all')
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all')
  const [showPast, setShowPast]           = useState(false)
  const [showAllFuzzy, setShowAllFuzzy]   = useState(false)
  const [flashDate, setFlashDate]         = useState<string | null>(null)
  const [now, setNow]                     = useState(Date.now())
  const scrolledRef = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

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

  const today    = new Date().toISOString().slice(0, 10)
  const curWeek  = mondayOf(today)

  // ── Derived: dates → weeks ──────────────────────────────────────────────────
  const ligaDates = new Set(matches.map(m => m.date.slice(0, 10)))
  const allDates  = [...new Set([...ligaDates, ...TAV_MAP.keys()])].sort()
  const weeks     = [...new Set(allDates.map(mondayOf))].sort()
  const pastWeeks    = weeks.filter(w => w < curWeek)
  const presentWeeks = weeks.filter(w => w >= curWeek)

  const passesTier = (m: Match) =>
    filter === 'all' || divisionTier(m.division) === TIER_OF[filter]

  const dayMatches = (date: string) =>
    matches.filter(m => m.date.slice(0, 10) === date && passesTier(m))
      .sort((a, b) => divisionTier(a.division) - divisionTier(b.division) || a.date.localeCompare(b.date))

  const dayTavlingar = (date: string) => TAV_MAP.get(date) ?? []

  const dayHasContent = (date: string) =>
    (contentFilter !== 'tavlingar' && dayMatches(date).length > 0) ||
    (contentFilter !== 'liga' && dayTavlingar(date).length > 0)

  const weekDates = (wk: string) => allDates.filter(d => mondayOf(d) === wk && dayHasContent(d))

  // ── Auto-scroll: land on current/next week (or ?date= week) ────────────────
  useEffect(() => {
    if (loading || scrolledRef.current || weeks.length === 0) return
    scrolledRef.current = true
    const dp = new URLSearchParams(window.location.search).get('date')
    let target: string | null = null
    if (dp && allDates.includes(dp)) {
      target = mondayOf(dp)
      if (target < curWeek) setShowPast(true)
    }
    if (!target) target = presentWeeks.find(wk => weekDates(wk).length > 0) ?? null
    if (!target || target === presentWeeks[0]) return  // already at top
    const wk = target
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById('week-' + wk)?.scrollIntoView({ block: 'start' })
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // Atlas "Visa veckan i schemat" → scroll feed + flash the day
  const jumpToDate = (date: string) => {
    if (mondayOf(date) < curWeek) setShowPast(true)
    setFlashDate(date)
    setTimeout(() => {
      document.getElementById('week-' + mondayOf(date))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    setTimeout(() => setFlashDate(null), 2600)
  }

  // Upcoming counts per tier — hides empty filter pills
  const upcomingByTier = (t: TierFilter) => matches.filter(m =>
    m.date.slice(0, 10) >= today &&
    (t === 'all' || divisionTier(m.division) === TIER_OF[t])).length

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted }}>Laddar...</div>
    </main>
  )

  // ── Tävling card ────────────────────────────────────────────────────────────
  const TavCard = ({ t, forDate }: { t: Tavling; forDate?: string }) => {
    const isLive = t.status === 'pagaende'
    const dc     = isLive ? GOLD : t.status === 'kommande' ? C.accent : C.textMuted

    let dayInfo: string | null = null
    if (t.dateFrom && t.dateTo && forDate) {
      const totalDays = Math.round(
        (new Date(t.dateTo + 'T12:00:00').getTime() - new Date(t.dateFrom + 'T12:00:00').getTime()) / 86400000
      ) + 1
      if (totalDays > 1) {
        const dayNum = Math.round(
          (new Date(forDate + 'T12:00:00').getTime() - new Date(t.dateFrom + 'T12:00:00').getTime()) / 86400000
        ) + 1
        dayInfo = `Dag ${dayNum} av ${totalDays}`
      }
    }

    return (
      <div style={{ margin: '8px 8px 4px', borderRadius: 14, overflow: 'hidden',
        background: isDark
          ? isLive ? 'rgba(245,194,0,0.07)' : 'rgba(245,194,0,0.05)'
          : isLive ? 'rgba(245,194,0,0.04)' : 'rgba(245,194,0,0.03)',
        border: `1px solid ${isLive ? 'rgba(245,194,0,0.25)' : isDark ? 'rgba(245,194,0,0.15)' : 'rgba(245,194,0,0.2)'}` }}>
        <div style={{ height: 2, background: isLive
          ? `linear-gradient(90deg,${GOLD},rgba(245,194,0,0.2))`
          : 'linear-gradient(90deg,#f5c200,rgba(245,194,0,0.15))' }} />
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {isLive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD,
                boxShadow: `0 0 5px ${GOLD}` }} />}
              <span style={{ fontSize: 9, fontWeight: 800, color: dc, letterSpacing: 1 }}>
                {isLive ? 'PÅGÅENDE' : t.status === 'kommande' ? 'KOMMANDE' : 'AVSLUTAD'}
              </span>
            </div>
            {dayInfo && (
              <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted,
                background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                padding: '2px 7px', borderRadius: 4, marginLeft: 'auto' }}>
                {dayInfo}
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{t.name}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>{t.subtitle}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 12 }}>
            {t.dateLabel} · {t.venue}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            <a href={t.href}
              style={{ fontSize: 11, fontWeight: 700, color: '#1a1400', background: C.accent,
                borderRadius: 8, padding: '6px 14px', textDecoration: 'none' }}>
              {t.buttonLabel}
            </a>
            {t.officialHref && t.officialHref !== t.href && (
              <a href={t.officialHref} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, fontWeight: 700, color: C.textMuted,
                  border: '1px solid ' + C.border, borderRadius: 8, padding: '6px 14px', textDecoration: 'none' }}>
                Officiell sida ↗
              </a>
            )}
            {t.extraButtons?.map(b => (
              <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, fontWeight: 700, color: C.textMuted,
                  border: '1px solid ' + C.border, borderRadius: 8, padding: '6px 14px', textDecoration: 'none' }}>
                {b.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Match row (tier-based sizing preserved from previous design) ────────────
  const MatchRow = ({ m }: { m: Match }) => {
    const tier        = divisionTier(m.division)
    const dc          = divisionColor(m.division)
    const isCompleted = m.home_score !== null
    const isLive      = m.status === 'live'
    const homeWin     = (m.home_score ?? 0) > (m.away_score ?? 0)
    const awayWin     = (m.away_score ?? 0) > (m.home_score ?? 0)
    const isToday     = m.date.slice(0, 10) === today
    const cd          = !isCompleted && !isLive && isToday ? cdStr(m.date, now) : null
    const time        = matchTime(m.date)

    const nameFontSize  = tier === 1 ? 15 : tier === 3 ? 13 : 14
    const nameWeight    = tier === 1 ? 600 : 400
    const winWeight     = tier === 1 ? 800 : 700
    const scoreFontSize = tier === 1 ? 20 : tier === 3 ? 14 : 16
    const rowPadding    = tier === 1 ? '13px 8px' : tier === 3 ? '7px 8px' : '10px 8px'
    const borderWidth   = tier === 1 ? 4 : tier === 3 ? 2 : 3
    const rowMargin     = tier === 1 ? '3px 6px' : tier === 3 ? '1px 10px' : '2px 8px'
    const rowBg         = tier === 1 ? hexAlpha(dc, isDark ? 0.06 : 0.03) : 'transparent'

    return (
      <a href={'/matches/' + m.id}
        style={{ display: 'flex', alignItems: 'stretch', textDecoration: 'none',
          borderRadius: tier === 1 ? 10 : 8, margin: rowMargin, overflow: 'hidden',
          background: rowBg,
          WebkitTapHighlightColor: 'transparent' } as any}
        onMouseEnter={e => (e.currentTarget.style.background = C.card)}
        onMouseLeave={e => (e.currentTarget.style.background = rowBg)}
      >
        <div style={{ width: borderWidth, flexShrink: 0, background: dc }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: rowPadding, gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: nameFontSize,
              fontWeight: homeWin ? winWeight : nameWeight,
              color: isCompleted ? (homeWin ? C.text : C.textMuted) : C.text,
              textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shortName(m.home?.name || '')}
            </div>
            <div style={{ flexShrink: 0, width: 68, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isLive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555',
                    display: 'inline-block', boxShadow: '0 0 4px #e05555' }} />
                  <span style={{ fontSize: 8, fontWeight: 800, color: '#e05555', letterSpacing: 0.5 }}>LIVE</span>
                </div>
              )}
              {isCompleted || isLive ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ fontSize: scoreFontSize, fontWeight: 900, lineHeight: 1,
                    color: homeWin ? C.accent : C.textMuted }}>{m.home_score}</span>
                  <span style={{ fontSize: scoreFontSize - 5, color: C.textMuted, fontWeight: 300 }}>–</span>
                  <span style={{ fontSize: scoreFontSize, fontWeight: 900, lineHeight: 1,
                    color: awayWin ? C.accent : C.textMuted }}>{m.away_score}</span>
                </div>
              ) : cd ? (
                <div style={{ fontSize: tier === 1 ? 13 : 12, fontWeight: 800, color: C.accent,
                  fontVariantNumeric: 'tabular-nums' }}>{cd}</div>
              ) : (
                <div style={{ fontSize: tier === 3 ? 11 : 12, fontWeight: 600, color: C.textMuted }}>{time}</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, fontSize: nameFontSize,
              fontWeight: awayWin ? winWeight : nameWeight,
              color: isCompleted ? (awayWin ? C.text : C.textMuted) : C.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shortName(m.away?.name || '')}
            </div>
          </div>
          {m.venue ? (
            <div style={{ fontSize: 9, color: C.textMuted, padding: '0 8px 7px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.venue}
            </div>
          ) : null}
        </div>
      </a>
    )
  }

  // ── Division group within a day ─────────────────────────────────────────────
  const DivisionGroup = ({ div, ms }: { div: string; ms: Match[] }) => {
    const dc    = divisionColor(div)
    const tier  = divisionTier(div)
    const round = ms[0]?.round
    return (
      <div>
        {tier === 1 ? (
          <div style={{
            background: `linear-gradient(90deg, ${hexAlpha(dc, isDark ? 0.14 : 0.08)} 0%, transparent 75%)`,
            borderBottom: '1px solid ' + C.border,
            borderLeft: `4px solid ${dc}`,
            padding: '14px 14px 10px', marginTop: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: dc, letterSpacing: 1.5 }}>
                {div.toUpperCase()}
              </span>
              {round != null && (
                <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted }}>
                  Omgång {round}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>
              {ms.length} {ms.length === 1 ? 'match' : 'matcher'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 16px 6px', borderBottom: '1px solid ' + C.border }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: dc, flexShrink: 0 }} />
            <div style={{ fontSize: 10, fontWeight: 800, color: dc, letterSpacing: 1.5, flex: 1 }}>
              {div.toUpperCase()}
            </div>
            {round != null && (
              <div style={{ fontSize: 9, fontWeight: 600, color: C.textMuted, letterSpacing: 0.3 }}>
                Omgång {round}
              </div>
            )}
          </div>
        )}
        {ms.map(m => <MatchRow key={m.id} m={m} />)}
      </div>
    )
  }

  // ── Day within a week ───────────────────────────────────────────────────────
  const DaySection = ({ date }: { date: string }) => {
    const ms   = contentFilter !== 'tavlingar' ? dayMatches(date) : []
    const tavs = contentFilter !== 'liga' ? dayTavlingar(date) : []
    if (ms.length === 0 && tavs.length === 0) return null
    const divisions = [...new Set(ms.map(m => m.division))]
      .sort((a, b) => divisionTier(a) - divisionTier(b))
    const isFlash = flashDate === date
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 2px',
          borderRadius: 8, transition: 'background 0.6s',
          background: isFlash ? hexAlpha(GOLD, isDark ? 0.12 : 0.15) : 'transparent' }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
            color: date === today ? C.accent : C.textMuted }}>
            {dateLabel(date)}
          </span>
          {date === today && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent,
              boxShadow: `0 0 4px ${hexAlpha(GOLD, 0.6)}` }} />
          )}
        </div>
        {tavs.map(t => <TavCard key={t.id} t={t} forDate={date} />)}
        {tavs.length > 0 && divisions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 4px' }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1 }}>LIGAMATCHER</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
        )}
        {divisions.map(div => (
          <DivisionGroup key={div} div={div} ms={ms.filter(m => m.division === div)} />
        ))}
      </div>
    )
  }

  // ── Week section ────────────────────────────────────────────────────────────
  const WeekSection = ({ wk }: { wk: string }) => {
    const dates = weekDates(wk)
    if (dates.length === 0) return null
    const isCur    = wk === curWeek
    const nLiga    = contentFilter !== 'tavlingar'
      ? dates.reduce((n, d) => n + dayMatches(d).length, 0) : 0
    const tavIds   = new Set<string>()
    if (contentFilter !== 'liga')
      dates.forEach(d => dayTavlingar(d).forEach(t => tavIds.add(t.id)))
    return (
      <section id={'week-' + wk} style={{ scrollMarginTop: 110 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 16px 4px' }}>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1,
            color: isCur ? '#1a1400' : C.textMuted,
            background: isCur ? C.accent : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
            padding: '2px 8px', borderRadius: 5 }}>
            V.{isoWeek(wk)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{weekRangeLabel(wk)}</span>
          {isCur && (
            <span style={{ fontSize: 9, fontWeight: 800, color: C.accent, letterSpacing: 1 }}>
              DENNA VECKA
            </span>
          )}
          <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 'auto' }}>
            {nLiga > 0 && `${nLiga} matcher`}
            {nLiga > 0 && tavIds.size > 0 && ' · '}
            {tavIds.size > 0 && `◆ ${tavIds.size} ${tavIds.size === 1 ? 'tävling' : 'tävlingar'}`}
          </span>
        </div>
        <div style={{ height: 1, background: C.border, margin: '4px 16px 0' }} />
        {dates.map(d => <DaySection key={d} date={d} />)}
      </section>
    )
  }

  const hasFutureContent = presentWeeks.some(wk => weekDates(wk).length > 0)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

        {/* ── Season atlas — the zoomed-out map of the whole season ──────────── */}
        <div style={{ margin: '10px 8px 0', borderRadius: 14, background: C.surface,
          border: '1px solid ' + C.border, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 0' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2 }}>
              SÄSONGSATLAS
            </span>
            <a href="/atlas" style={{ fontSize: 10, fontWeight: 700, color: C.accent,
              textDecoration: 'none', marginLeft: 'auto' }}>
              Utforska atlasen →
            </a>
          </div>
          <SeasonAtlas matches={matches} tavMap={TAV_MAP} C={C} isDark={isDark}
            onJumpToDate={jumpToDate} />
        </div>

        {/* ── Sticky filter bar ───────────────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 56, background: C.bg, zIndex: 30,
          borderBottom: '1px solid ' + C.border, overflowX: 'auto', scrollbarWidth: 'none',
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' } as any}>

          <button onClick={() => setShowPast(p => !p)}
            style={{ border: '1px solid ' + C.border, background: showPast ? C.card : 'transparent',
              borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700,
              color: C.textMuted, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              WebkitTapHighlightColor: 'transparent' } as any}>
            {showPast ? '✕ Tidigare' : `↑ Tidigare (${pastWeeks.length})`}
          </button>

          <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />

          {([
            { key: 'all',       label: 'Allt' },
            { key: 'liga',      label: 'Liga' },
            { key: 'tavlingar', label: 'Tävlingar' },
          ] as const).map(f => {
            const isActive = contentFilter === f.key
            return (
              <button key={f.key} onClick={() => setContentFilter(f.key)}
                style={{ background: isActive ? C.accent : 'transparent',
                  border: '1px solid ' + (isActive ? C.accent : C.border),
                  borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  color: isActive ? '#1a1400' : C.textMuted, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent' } as any}>
                {f.label}
              </button>
            )
          })}

          {contentFilter !== 'tavlingar' && (
            <>
              <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />
              {([
                { key: 'all',         label: 'Alla' },
                { key: 'elite',       label: 'Elitserien' },
                { key: 'allsvenskan', label: 'Allsvenskan' },
                { key: 'div1',        label: 'Division 1' },
              ] as const).map(f => {
                if (f.key !== 'all' && upcomingByTier(f.key) === 0) return null
                const isActive = filter === f.key
                return (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    style={{ background: isActive ? C.accent : 'transparent',
                      border: '1px solid ' + (isActive ? C.accent : C.border),
                      borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                      color: isActive ? '#1a1400' : C.textMuted, cursor: 'pointer',
                      whiteSpace: 'nowrap', flexShrink: 0,
                      WebkitTapHighlightColor: 'transparent' } as any}>
                    {f.label}
                  </button>
                )
              })}
            </>
          )}
        </div>

        {/* ── The feed: past weeks (toggled) then current/future weeks ───────── */}
        <AnimatePresence initial={false}>
          {showPast && (
            <motion.div key="past"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {pastWeeks.map(wk => <WeekSection key={wk} wk={wk} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {presentWeeks.map(wk => <WeekSection key={wk} wk={wk} />)}

        {!hasFutureContent && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Inga kommande matcher
            </div>
            {!showPast && pastWeeks.length > 0 && (
              <button onClick={() => setShowPast(true)}
                style={{ fontSize: 12, fontWeight: 700, color: C.accent,
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 } as any}>
                Visa tidigare veckor →
              </button>
            )}
          </div>
        )}

        {matches.length > 0 && (
          <div style={{ padding: '16px 20px' }}>
            <a href="https://bits.swebowl.se" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none' }}>
              Fullständig info på BITS ↗
            </a>
          </div>
        )}

        {/* ── Kommande tävlingar — fuzzy-dated events ─────────────────────────── */}
        {FUZZY_TAV.length > 0 && contentFilter !== 'liga' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 16px 6px', borderBottom: '1px solid ' + C.border }}>
              <div style={{ width: 5, height: 5, borderRadius: 1, transform: 'rotate(45deg)',
                background: GOLD, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>
                KOMMANDE TÄVLINGAR
              </span>
            </div>
            {(showAllFuzzy ? FUZZY_TAV : FUZZY_TAV.slice(0, 2)).map(t => (
              <TavCard key={t.id} t={t} />
            ))}
            {!showAllFuzzy && FUZZY_TAV.length > 2 && (
              <button onClick={() => setShowAllFuzzy(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%',
                  padding: '12px 16px', border: 'none', background: 'transparent',
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  borderTop: '1px solid ' + C.border } as any}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>
                  Visa alla tävlingar
                </span>
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  +{FUZZY_TAV.length - 2} till →
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
