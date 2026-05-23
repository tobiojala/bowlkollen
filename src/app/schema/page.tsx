'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName } from '@/lib/utils'
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
type Tavling = {
  id: string; name: string; subtitle: string
  dateFrom: string | null   // ISO "2026-05-15" or null for fuzzy
  dateTo: string | null     // ISO "2026-05-17" or null
  dateLabel: string         // human-readable display
  venue: string; status: 'pagaende' | 'kommande' | 'avslutad'
  href: string; buttonLabel: string
  officialHref?: string
  extraButtons?: { label: string; href: string }[]
}

// ── Tävlingar data ────────────────────────────────────────────────────────────
// dateFrom/dateTo: specific dates appear inline in the calendar.
// dateFrom: null → fuzzy date, lives in "Kommande tävlingar" section.
const TAVLINGAR: Tavling[] = [
  {
    id: 'sm-slutspel-2026', name: 'SM-slutspel 2026',
    subtitle: 'Semifinaler och final i Elitserien Herrar och Damer',
    dateFrom: '2026-05-15', dateTo: '2026-05-17',
    dateLabel: '15–17 maj 2026', venue: 'Lucky Bowl, Helsingborg',
    status: 'pagaende', href: '/schema', buttonLabel: 'Se matcher',
  },
  {
    id: 'gp-final-2026', name: 'Challenger Grand Prix — Final',
    subtitle: 'Tourfinal i Stockholm — 6 deltävlingar bakom sig',
    dateFrom: '2026-05-16', dateTo: '2026-05-17',
    dateLabel: '16–17 maj 2026', venue: 'Sollentuna',
    status: 'pagaende', href: 'https://gp.stbf.se',
    officialHref: 'https://gp.stbf.se', buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://gp.stbf.se/allresults.php' },
      { label: 'Barometer', href: 'https://gp.stbf.se/standings.php' },
    ],
  },
  {
    id: 'sllm-2026', name: 'Storm Lucky Larsen Masters 2026',
    subtitle: 'Internationell PBA Tour-tävling — Sveriges största öppna turnering',
    dateFrom: '2026-08-22', dateTo: '2026-08-30',
    dateLabel: '22–30 aug 2026', venue: 'Lucky Bowl, Helsingborg',
    status: 'kommande', href: '/sllm', officialHref: 'https://www.luckylarsen.se',
    buttonLabel: 'Mer info',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://sbe.bowlres.se/sllm26' },
      { label: 'Livestream', href: 'https://www.youtube.com/@stormluckylarsenmasters' },
    ],
  },
  // ── Fuzzy-dated (dateFrom: null) — appear in Kommande section ─────────────
  {
    id: 'syt-2026', name: 'PBA jr. Swedish Youth Tour 2026',
    subtitle: 'Ungdomstour — U16, U21 killar och tjejer',
    dateFrom: null, dateTo: null, dateLabel: '2025/2026',
    venue: 'Olympia, Nässjö, Gullmarsplan',
    status: 'pagaende', href: 'https://syt.bowlres.se',
    officialHref: 'https://syt.bowlres.se', buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://syt.bowlres.se/allresults.php' },
      { label: 'Anmäl dig', href: 'https://syt.bowlres.se/register.php' },
    ],
  },
  {
    id: 'battle-of-smaland-2026', name: 'The Battle of Småland 2026',
    subtitle: 'Sveriges största sommartävling — prissumma 53 000 kr',
    dateFrom: null, dateTo: null, dateLabel: 'Sommar 2026',
    venue: 'RC Bowl, Jönköping',
    status: 'kommande', href: 'https://rc-bowl.bowlres.se',
    officialHref: 'https://rc-bowl.bowlres.se', buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://rc-bowl.bowlres.se/register.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@RcBowllive' },
    ],
  },
  {
    id: 'aikl-2026', name: 'MOTIV AIK Ladies 2026',
    subtitle: 'Öppen damtävling i Stockholm',
    dateFrom: null, dateTo: null, dateLabel: '2026',
    venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikl.aikbowling.se',
    officialHref: 'https://aikl.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikj-2026', name: 'MOTIV AIK Junior 2026',
    subtitle: 'Öppen juniortävling i Stockholm',
    dateFrom: null, dateTo: null, dateLabel: '2026',
    venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikj.aikbowling.se',
    officialHref: 'https://aikj.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'qak-2026', name: 'Queens and Kings 2026',
    subtitle: 'Öppen tävling',
    dateFrom: null, dateTo: null, dateLabel: '2026',
    venue: 'Sverige',
    status: 'kommande', href: 'https://qak.bowlres.se',
    officialHref: 'https://qak.bowlres.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikmix-2026', name: 'AIK-mixen 2026',
    subtitle: 'Öppen mixedtävling i Stockholm',
    dateFrom: null, dateTo: null, dateLabel: '2026',
    venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikmix.aikbowling.se',
    officialHref: 'https://aikmix.aikbowling.se', buttonLabel: 'Officiell sida',
  },
]

// Expand date ranges into date → Tavling[] map (built once at module load)
function buildTavMap(): Map<string, Tavling[]> {
  const map = new Map<string, Tavling[]>()
  TAVLINGAR.filter(t => t.dateFrom).forEach(t => {
    const end = new Date((t.dateTo ?? t.dateFrom!) + 'T12:00:00')
    const cur = new Date(t.dateFrom! + 'T12:00:00')
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
      cur.setDate(cur.getDate() + 1)
    }
  })
  return map
}

const TAV_MAP   = buildTavMap()
const FUZZY_TAV = TAVLINGAR.filter(t => !t.dateFrom && t.status !== 'avslutad')

// ── Division helpers ──────────────────────────────────────────────────────────
const DIVISION_TIERS: Record<string, number> = {
  'Elitserien Herrar': 1, 'Elitserien Damer': 1,
  'SM-slutspel Herrar': 1, 'SM-slutspel Damer': 1,
  'Mellanallsvenskan Herrar': 2, 'Nordallsvenskan Herrar': 2,
  'Sydallsvenskan Herrar': 2, 'Norra Allsvenskan Herrar': 2,
  'Södra Allsvenskan Herrar': 2,
}
function getTier(d: string) { return DIVISION_TIERS[d] || 3 }
function getDivColor(d: string): string {
  if (d.includes('SM'))                                    return 'hsl(44, 50%, 52%)'
  if (d.includes('Elitserien') && d.includes('Damer'))    return 'hsl(320, 30%, 58%)'
  if (d.includes('Elitserien'))                           return 'hsl(210, 35%, 55%)'
  if (getTier(d) === 2)                                   return 'hsl(130, 22%, 50%)'
  return 'hsl(35, 12%, 52%)'
}

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

const SPRING = { type: 'spring', stiffness: 320, damping: 30 } as const

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { theme } = useTheme()
  const C    = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [matches, setMatches]       = useState<Match[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [filter, setFilter]         = useState<'all' | 'elite' | 'allsvenskan' | 'div1'>('all')
  const [showPast, setShowPast]     = useState(false)
  const [now, setNow]               = useState(Date.now())

  const scrollRef     = useRef<HTMLDivElement>(null)
  const activeDateRef = useRef<HTMLButtonElement>(null)

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
        if (data) {
          setMatches(data as unknown as Match[])
          const today    = new Date().toISOString().slice(0, 10)
          const ligaDates = [...new Set((data as any[]).map((m: any) => m.date.slice(0, 10)))].sort()
          const allDates  = [...new Set([...ligaDates, ...[...TAV_MAP.keys()]])].sort()
          const params    = new URLSearchParams(window.location.search)
          const dp        = params.get('date')
          if (dp && allDates.includes(dp)) {
            setActiveDate(dp)
            if (dp < today) setShowPast(true)
          } else {
            const next = allDates.find(d => d >= today)
            setActiveDate(next ?? allDates[allDates.length - 1] ?? null)
          }
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (activeDateRef.current && scrollRef.current) {
      setTimeout(() => {
        const el = activeDateRef.current!
        const c  = scrollRef.current!
        c.scrollTo({ left: el.offsetLeft - c.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
      }, 150)
    }
  }, [activeDate, loading])

  const today  = new Date().toISOString().slice(0, 10)
  const days   = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

  // Unified date list: union of liga match dates + tävling dates
  const ligaDateSet  = new Set(matches.map(m => m.date.slice(0, 10)))
  const allDates     = [...new Set([...ligaDateSet, ...[...TAV_MAP.keys()]])].sort()
  const visibleDates = showPast ? allDates : allDates.filter(d => d >= today || d === activeDate)
  const nextDate     = allDates.find(d => d >= today) ?? null

  const fmtDate = (d: string) => {
    const dt = new Date(d + 'T12:00:00')
    return `${days[dt.getDay()]} ${dt.getDate()} ${months[dt.getMonth()]}`
  }

  const filterMatches = (ms: Match[]) => {
    if (filter === 'elite')       return ms.filter(m => getTier(m.division) === 1)
    if (filter === 'allsvenskan') return ms.filter(m => getTier(m.division) === 2)
    if (filter === 'div1')        return ms.filter(m => getTier(m.division) === 3)
    return ms
  }

  const dayLigaMatches = activeDate
    ? matches.filter(m => m.date.slice(0, 10) === activeDate)
        .sort((a, b) => getTier(a.division) - getTier(b.division))
    : []
  const activeMatches = filterMatches(dayLigaMatches)
  const divisions     = [...new Set(activeMatches.map(m => m.division))]
    .sort((a, b) => getTier(a) - getTier(b))
  const dayTavlingar  = activeDate ? (TAV_MAP.get(activeDate) ?? []) : []

  const countOnDate = (dateKey: string, f: typeof filter) => {
    const ms = matches.filter(m => m.date.slice(0, 10) === dateKey)
    if (f === 'elite')       return ms.filter(m => getTier(m.division) === 1).length
    if (f === 'allsvenskan') return ms.filter(m => getTier(m.division) === 2).length
    if (f === 'div1')        return ms.filter(m => getTier(m.division) === 3).length
    return ms.length
  }

  const isEmpty = dayLigaMatches.length === 0 && dayTavlingar.length === 0

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted }}>Laddar...</div>
    </main>
  )

  // ── Tävling card ─────────────────────────────────────────────────────────────
  const TavCard = ({ t }: { t: Tavling }) => {
    const isLive  = t.status === 'pagaende'
    const dc      = isLive ? '#e05555' : t.status === 'kommande' ? C.accent : C.textMuted

    // Multi-day: compute "Dag X av Y"
    let dayInfo: string | null = null
    if (t.dateFrom && t.dateTo && activeDate) {
      const totalDays = Math.round(
        (new Date(t.dateTo + 'T12:00:00').getTime() - new Date(t.dateFrom + 'T12:00:00').getTime()) / 86400000
      ) + 1
      if (totalDays > 1) {
        const dayNum = Math.round(
          (new Date(activeDate + 'T12:00:00').getTime() - new Date(t.dateFrom + 'T12:00:00').getTime()) / 86400000
        ) + 1
        dayInfo = `Dag ${dayNum} av ${totalDays}`
      }
    }

    return (
      <div style={{ margin: '8px 8px 4px', borderRadius: 14, overflow: 'hidden',
        background: isDark
          ? isLive ? 'rgba(224,85,85,0.07)' : 'rgba(245,194,0,0.05)'
          : isLive ? 'rgba(224,85,85,0.04)' : 'rgba(245,194,0,0.03)',
        border: `1px solid ${isLive ? 'rgba(224,85,85,0.25)' : isDark ? 'rgba(245,194,0,0.15)' : 'rgba(245,194,0,0.2)'}` }}>
        <div style={{ height: 2, background: isLive
          ? 'linear-gradient(90deg,#e05555,rgba(224,85,85,0.2))'
          : 'linear-gradient(90deg,#f5c200,rgba(245,194,0,0.15))' }} />
        <div style={{ padding: '12px 14px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {isLive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e05555',
                boxShadow: '0 0 5px #e05555' }} />}
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sticky header ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 56, background: C.bg, zIndex: 30,
        borderBottom: '1px solid ' + C.border }}>

        {/* Unified date strip */}
        <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', alignItems: 'stretch' } as any}>

          {/* Historik toggle */}
          <button onClick={() => setShowPast(p => !p)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '6px 10px', border: 'none', background: 'transparent', flexShrink: 0, cursor: 'pointer',
              borderRight: '1px solid ' + C.border, borderBottom: '2px solid transparent',
              WebkitTapHighlightColor: 'transparent' } as any}>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, whiteSpace: 'nowrap', letterSpacing: 0.3 }}>
              {showPast ? '✕' : '← Historik'}
            </span>
          </button>

          {visibleDates.map(dateKey => {
            const d        = new Date(dateKey + 'T12:00:00')
            const isActive = dateKey === activeDate
            const isToday  = dateKey === today
            const isPast   = dateKey < today
            const hasLiga  = ligaDateSet.has(dateKey)
            const hasTav   = TAV_MAP.has(dateKey)
            return (
              <button key={dateKey} ref={isActive ? activeDateRef : null}
                onClick={() => setActiveDate(dateKey)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '7px 12px 5px', border: 'none',
                  borderBottom: '2px solid ' + (isActive ? C.accent : 'transparent'),
                  background: isToday && !isActive
                    ? (isDark ? 'rgba(245,194,0,0.04)' : 'rgba(245,194,0,0.06)')
                    : 'transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  opacity: isPast && !isActive ? 0.32 : 1, gap: 1,
                  WebkitTapHighlightColor: 'transparent' } as any}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1,
                  color: isActive ? C.accent : isToday ? C.accent : C.textMuted }}>
                  {isToday ? 'IDAG' : days[d.getDay()].toUpperCase()}
                </span>
                <span style={{ fontSize: 14, fontWeight: isActive || isToday ? 700 : 400,
                  color: isActive ? C.accent : C.text }}>
                  {d.getDate()} {months[d.getMonth()]}
                </span>
                {/* Content-type dots */}
                <div style={{ display: 'flex', gap: 3, alignItems: 'center', minHeight: 8, marginTop: 2 }}>
                  {hasLiga && (
                    <div style={{ width: 4, height: 4, borderRadius: '50%',
                      background: isActive ? C.accent : 'hsl(210,35%,58%)' }} />
                  )}
                  {hasTav && (
                    <div style={{ width: 4, height: 4, borderRadius: 1, transform: 'rotate(45deg)',
                      background: isActive ? C.accent : '#f5c200' }} />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Filter pills — shown only when there are liga matches on this day */}
        {dayLigaMatches.length > 0 && (
          <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '8px 16px' } as any}>
            {([
              { key: 'all',         label: 'Alla' },
              { key: 'elite',       label: 'Elitserien' },
              { key: 'allsvenskan', label: 'Allsvenskan' },
              { key: 'div1',        label: 'Division 1' },
            ] as const).map(f => {
              const isActive = filter === f.key
              const count    = activeDate ? countOnDate(activeDate, f.key) : 0
              if (f.key !== 'all' && count === 0) return null
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ background: isActive ? C.accent : 'transparent',
                    border: '1px solid ' + (isActive ? C.accent : C.border),
                    borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                    color: isActive ? '#1a1400' : C.textMuted, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    WebkitTapHighlightColor: 'transparent' } as any}>
                  {f.label}{count > 0 ? ` · ${count}` : ''}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Day content — animates on date change ─────────────────────────────── */}
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeDate ?? 'empty'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING}>

            {/* Jump back chip when on a past date */}
            {activeDate && activeDate < today && nextDate && (
              <div style={{ padding: '10px 16px' }}>
                <button onClick={() => setActiveDate(nextDate)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
                    border: '1px solid ' + C.border, borderRadius: 20, padding: '6px 14px',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as any}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>Nästa omgång</span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{fmtDate(nextDate)} →</span>
                </button>
              </div>
            )}

            {/* Tävlingar on this day */}
            {dayTavlingar.map(t => <TavCard key={t.id} t={t} />)}

            {/* Divider between tävlingar and liga when both exist */}
            {dayTavlingar.length > 0 && dayLigaMatches.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 4px' }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1 }}>LIGAMATCHER</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
            )}

            {/* Liga matches grouped by division */}
            {divisions.map(div => {
              const divMatches = activeMatches.filter(m => m.division === div)
              const dc         = getDivColor(div)
              const round      = divMatches[0]?.round
              return (
                <div key={div}>
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

                  {divMatches.map(m => {
                    const isCompleted = m.home_score !== null
                    const isLive      = m.status === 'live'
                    const homeWin     = (m.home_score ?? 0) > (m.away_score ?? 0)
                    const awayWin     = (m.away_score ?? 0) > (m.home_score ?? 0)
                    const isToday     = m.date.slice(0, 10) === today
                    const cd          = !isCompleted && !isLive && isToday ? cdStr(m.date, now) : null
                    const time        = matchTime(m.date)

                    return (
                      <a key={m.id} href={'/matches/' + m.id}
                        style={{ display: 'flex', alignItems: 'stretch', textDecoration: 'none',
                          borderRadius: 8, margin: '2px 8px', overflow: 'hidden',
                          WebkitTapHighlightColor: 'transparent' } as any}
                        onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: 3, flexShrink: 0, background: dc }} />
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 8px', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: homeWin ? 700 : 400,
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
                                  <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1,
                                    color: homeWin ? C.accent : C.textMuted }}>{m.home_score}</span>
                                  <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 300 }}>–</span>
                                  <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1,
                                    color: awayWin ? C.accent : C.textMuted }}>{m.away_score}</span>
                                </div>
                              ) : cd ? (
                                <div style={{ fontSize: 12, fontWeight: 800, color: C.accent,
                                  fontVariantNumeric: 'tabular-nums' }}>{cd}</div>
                              ) : (
                                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>{time}</div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: awayWin ? 700 : 400,
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
                  })}
                </div>
              )
            })}

            {/* Empty state */}
            {isEmpty && (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                  Inga matcher den här dagen
                </div>
                {nextDate && activeDate !== nextDate && (
                  <button onClick={() => setActiveDate(nextDate)}
                    style={{ fontSize: 12, fontWeight: 700, color: C.accent,
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 } as any}>
                    Nästa: {fmtDate(nextDate)} →
                  </button>
                )}
              </div>
            )}

            {activeMatches.length > 0 && (
              <div style={{ padding: '16px 20px' }}>
                <a href="https://bits.swebowl.se" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none' }}>
                  Fullständig info på BITS ↗
                </a>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Kommande tävlingar — always visible, fuzzy-dated events ──────────── */}
        {FUZZY_TAV.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 16px 6px', borderBottom: '1px solid ' + C.border }}>
              <div style={{ width: 5, height: 5, borderRadius: 1, transform: 'rotate(45deg)',
                background: '#f5c200', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>
                KOMMANDE TÄVLINGAR
              </span>
            </div>
            {FUZZY_TAV.map(t => {
              const isLive = t.status === 'pagaende'
              const dc     = isLive ? '#e05555' : C.accent
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'stretch',
                  borderBottom: '1px solid ' + C.border }}>
                  <div style={{ width: 3, flexShrink: 0, background: isLive ? '#e05555' : isDark ? 'rgba(245,194,0,0.4)' : 'rgba(245,194,0,0.5)' }} />
                  <div style={{ flex: 1, minWidth: 0, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      {isLive && <div style={{ width: 5, height: 5, borderRadius: '50%',
                        background: '#e05555', boxShadow: '0 0 4px #e05555' }} />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1, minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: dc, flexShrink: 0 }}>
                        {isLive ? 'PÅGÅENDE' : 'KOMMANDE'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{t.subtitle}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10 }}>
                      {t.dateLabel} · {t.venue}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                      <a href={t.href}
                        style={{ fontSize: 11, fontWeight: 700, color: '#1a1400', background: C.accent,
                          borderRadius: 8, padding: '5px 12px', textDecoration: 'none' }}>
                        {t.buttonLabel}
                      </a>
                      {t.officialHref && t.officialHref !== t.href && (
                        <a href={t.officialHref} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, fontWeight: 700, color: C.textMuted,
                            border: '1px solid ' + C.border, borderRadius: 8, padding: '5px 12px', textDecoration: 'none' }}>
                          Officiell sida ↗
                        </a>
                      )}
                      {t.extraButtons?.map(b => (
                        <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, fontWeight: 700, color: C.textMuted,
                            border: '1px solid ' + C.border, borderRadius: 8, padding: '5px 12px', textDecoration: 'none' }}>
                          {b.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
