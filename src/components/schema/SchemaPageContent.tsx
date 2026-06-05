'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/cn'
import { schemaDivider, schemaGhostPillClass, schemaPillClass } from '@/lib/schema-ui'
import { shortName } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { SchemaTavCard } from '@/components/schema/SchemaTavCard'

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
function divColorAlpha(d: string, alpha: number): string {
  return getDivColor(d).replace('hsl(', 'hsla(').replace(')', `, ${alpha})`)
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
export function SchemaPageContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [filter, setFilter]         = useState<'all' | 'elite' | 'allsvenskan' | 'div1'>('all')
  const [showPast, setShowPast]         = useState(false)
  const [contentFilter, setContentFilter] = useState<'all' | 'liga' | 'tavlingar'>('all')
  const [showAllFuzzy, setShowAllFuzzy]   = useState(false)
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
  const activeMatches = contentFilter !== 'tavlingar' ? filterMatches(dayLigaMatches) : []
  const divisions     = [...new Set(activeMatches.map(m => m.division))]
    .sort((a, b) => getTier(a) - getTier(b))
  const dayTavlingar  = activeDate && contentFilter !== 'liga' ? (TAV_MAP.get(activeDate) ?? []) : []

  const ligaCountByDate = new Map<string, number>()
  matches.forEach(m => {
    const key = m.date.slice(0, 10)
    ligaCountByDate.set(key, (ligaCountByDate.get(key) ?? 0) + 1)
  })

  const countOnDate = (dateKey: string, f: typeof filter) => {
    const ms = matches.filter(m => m.date.slice(0, 10) === dateKey)
    if (f === 'elite')       return ms.filter(m => getTier(m.division) === 1).length
    if (f === 'allsvenskan') return ms.filter(m => getTier(m.division) === 2).length
    if (f === 'div1')        return ms.filter(m => getTier(m.division) === 3).length
    return ms.length
  }

  const isEmpty = dayLigaMatches.length === 0 && dayTavlingar.length === 0

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-12 text-dark-muted">
        Laddar...
      </div>
    )
  }

  return (
    <div className="text-light-text dark:text-dark-text">
      <div className="sticky top-14 z-30 border-b border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg">
        <div
          ref={scrollRef}
          className="flex items-stretch overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleDates.map(dateKey => {
            const d = new Date(dateKey + 'T12:00:00')
            const isActive = dateKey === activeDate
            const isToday = dateKey === today
            const isPast = dateKey < today
            const hasLiga = ligaDateSet.has(dateKey)
            const hasTav = TAV_MAP.has(dateKey)
            const count = ligaCountByDate.get(dateKey) ?? 0
            return (
              <button
                key={dateKey}
                ref={isActive ? activeDateRef : null}
                type="button"
                onClick={() => setActiveDate(dateKey)}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-px border-0 border-b-2 px-3 pt-1.75 pb-1.25',
                  'whitespace-nowrap [-webkit-tap-highlight-color:transparent]',
                  isActive ? 'border-gold' : 'border-transparent',
                  isToday && !isActive && 'bg-gold/5 dark:bg-gold/4',
                  isPast && !isActive && 'opacity-[0.32]',
                )}
              >
                <span
                  className={cn(
                    'text-[9px] font-bold tracking-wide',
                    isActive || isToday ? 'text-gold' : 'text-dark-muted',
                  )}
                >
                  {isToday ? 'IDAG' : days[d.getDay()].toUpperCase()}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    isActive || isToday ? 'font-bold text-gold' : 'font-normal bk-text-primary',
                  )}
                >
                  {d.getDate()} {months[d.getMonth()]}
                </span>
                <div className="mt-0.5 flex min-h-3.5 items-center gap-0.75">
                  {hasLiga && contentFilter !== 'tavlingar' && count > 0 && (
                    <div
                      className={cn(
                        'min-w-3.5 rounded px-0.75 text-center text-[8px] leading-[13px] font-extrabold',
                        isActive
                          ? 'bg-gold text-[#1a1400]'
                          : 'bg-[hsl(210,40%,88%)] text-[hsl(210,40%,35%)] dark:bg-[hsl(210,30%,22%)] dark:text-[hsl(210,50%,75%)]',
                      )}
                    >
                      {count}
                    </div>
                  )}
                  {hasTav && contentFilter !== 'liga' && (
                    <div
                      className={cn(
                        'h-[5px] w-[5px] rotate-45 rounded-[1px] bg-gold',
                        !isActive && 'shadow-[0_0_3px_rgba(245,194,0,0.4)]',
                      )}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-light-border px-3 py-1.75 [scrollbar-width:none] dark:border-dark-border [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setShowPast(p => !p)}
            className={cn(
              schemaGhostPillClass,
              showPast && 'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
            )}
          >
            {showPast ? '✕ Historik' : '← Historik'}
          </button>
          <div className={schemaDivider} />
          {(
            [
              { key: 'all' as const, label: 'Allt' },
              { key: 'liga' as const, label: 'Liga' },
              { key: 'tavlingar' as const, label: 'Tävlingar' },
            ] as const
          ).map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setContentFilter(f.key)}
              className={schemaPillClass(contentFilter === f.key)}
            >
              {f.label}
            </button>
          ))}
          {contentFilter !== 'tavlingar' && dayLigaMatches.length > 0 && (
            <>
              <div className={schemaDivider} />
              {(
                [
                  { key: 'all' as const, label: 'Alla' },
                  { key: 'elite' as const, label: 'Elitserien' },
                  { key: 'allsvenskan' as const, label: 'Allsvenskan' },
                  { key: 'div1' as const, label: 'Division 1' },
                ] as const
              ).map(f => {
                const count = activeDate ? countOnDate(activeDate, f.key) : 0
                if (f.key !== 'all' && count === 0) return null
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={schemaPillClass(filter === f.key)}
                  >
                    {f.label}
                    {count > 0 ? ` · ${count}` : ''}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-app pb-12">
        <AnimatePresence mode="wait">
          <motion.div key={activeDate ?? 'empty'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING}>

            {activeDate && activeDate < today && nextDate && (
              <div className="px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setActiveDate(nextDate)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-light-border bg-transparent px-3.5 py-1.5 [-webkit-tap-highlight-color:transparent] dark:border-dark-border"
                >
                  <span className="text-[11px] font-bold text-gold">Nästa omgång</span>
                  <span className="text-[11px] text-dark-muted">{fmtDate(nextDate)} →</span>
                </button>
              </div>
            )}

            {dayTavlingar.map(t => (
              <SchemaTavCard key={t.id} t={t} activeDate={activeDate} />
            ))}

            {dayTavlingar.length > 0 && dayLigaMatches.length > 0 && (
              <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
                <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
                <span className="text-[9px] font-extrabold tracking-wide text-dark-muted">LIGAMATCHER</span>
                <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
              </div>
            )}

            {/* Liga matches grouped by division */}
            {divisions.map(div => {
              const divMatches = activeMatches.filter(m => m.division === div)
              const dc         = getDivColor(div)
              const round      = divMatches[0]?.round
              return (
                <div key={div}>
                  {getTier(div) === 1 ? (
                    <div
                      className="mt-1 border-b border-light-border py-3.5 pr-3.5 pl-3 dark:border-dark-border"
                      style={{
                        borderLeft: `4px solid ${dc}`,
                        background: `linear-gradient(90deg, ${divColorAlpha(div, isDark ? 0.14 : 0.08)} 0%, transparent 75%)`,
                      }}
                    >
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-xs font-black tracking-widest"
                          style={{ color: dc }}
                        >
                          {div.toUpperCase()}
                        </span>
                        {round != null && (
                          <span className="text-[10px] font-semibold text-dark-muted">Omgång {round}</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[10px] text-dark-muted">
                        {divMatches.length} {divMatches.length === 1 ? 'match' : 'matcher'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 border-b border-light-border px-4 pt-3.5 pb-1.5 dark:border-dark-border">
                      <div className="h-2 w-2 shrink-0 rounded-sm" style={{ background: dc }} />
                      <div className="flex-1 text-[10px] font-extrabold tracking-widest" style={{ color: dc }}>
                        {div.toUpperCase()}
                      </div>
                      {round != null && (
                        <div className="text-[9px] font-semibold tracking-wide text-dark-muted">
                          Omgång {round}
                        </div>
                      )}
                    </div>
                  )}

                  {divMatches.map(m => {
                    const isCompleted = m.home_score !== null
                    const isLive      = m.status === 'live'
                    const homeWin     = (m.home_score ?? 0) > (m.away_score ?? 0)
                    const awayWin     = (m.away_score ?? 0) > (m.home_score ?? 0)
                    const isToday     = m.date.slice(0, 10) === today
                    const cd          = !isCompleted && !isLive && isToday ? cdStr(m.date, now) : null
                    const time        = matchTime(m.date)
                    const tier        = getTier(m.division)

                    // Tier-based sizing
                    const nameSize =
                      tier === 1 ? 'text-[15px]' : tier === 3 ? 'text-[13px]' : 'text-sm'
                    const scoreSize =
                      tier === 1 ? 'text-xl' : tier === 3 ? 'text-sm' : 'text-base'
                    const rowPad =
                      tier === 1 ? 'px-2 py-3.25' : tier === 3 ? 'px-2 py-1.75' : 'px-2 py-2.5'
                    const barW = tier === 1 ? 'w-1' : tier === 3 ? 'w-0.5' : 'w-[3px]'
                    const rowMargin =
                      tier === 1 ? 'mx-1.5 my-0.75' : tier === 3 ? 'mx-2.5 my-px' : 'mx-2 my-0.5'
                    const rowBg =
                      tier === 1 ? divColorAlpha(m.division, isDark ? 0.06 : 0.03) : undefined

                    return (
                      <a
                        key={m.id}
                        href={'/matches/' + m.id}
                        className={cn(
                          'flex items-stretch overflow-hidden no-underline',
                          '[-webkit-tap-highlight-color:transparent]',
                          'transition-colors hover:bg-light-card dark:hover:bg-dark-card',
                          tier === 1 ? 'rounded-[10px]' : 'rounded-lg',
                          rowMargin,
                        )}
                        style={{ background: rowBg }}
                      >
                        <div className={cn('shrink-0', barW)} style={{ background: dc }} />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className={cn('flex items-center gap-2', rowPad)}>
                            <div
                              className={cn(
                                'min-w-0 flex-1 truncate text-right',
                                nameSize,
                                homeWin ? 'font-extrabold' : tier === 1 ? 'font-semibold' : 'font-normal',
                                isCompleted && !homeWin ? 'text-dark-muted' : 'bk-text-primary',
                              )}
                            >
                              {shortName(m.home?.name || '')}
                            </div>
                            <div className="flex w-[68px] shrink-0 flex-col items-center">
                              {isLive && (
                                <div className="mb-0.5 flex items-center gap-0.75">
                                  <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#e05555] shadow-[0_0_4px_#e05555]" />
                                  <span className="text-[8px] font-extrabold tracking-wide text-[#e05555]">
                                    LIVE
                                  </span>
                                </div>
                              )}
                              {isCompleted || isLive ? (
                                <div className="flex items-center justify-center gap-1">
                                  <span
                                    className={cn(
                                      'leading-none font-black',
                                      scoreSize,
                                      homeWin ? 'text-gold' : 'text-dark-muted',
                                    )}
                                  >
                                    {m.home_score}
                                  </span>
                                  <span className={cn('font-light text-dark-muted', tier === 1 ? 'text-[15px]' : 'text-[11px]')}>
                                    –
                                  </span>
                                  <span
                                    className={cn(
                                      'leading-none font-black',
                                      scoreSize,
                                      awayWin ? 'text-gold' : 'text-dark-muted',
                                    )}
                                  >
                                    {m.away_score}
                                  </span>
                                </div>
                              ) : cd ? (
                                <div
                                  className={cn(
                                    'font-extrabold text-gold tabular-nums',
                                    tier === 1 ? 'text-[13px]' : 'text-xs',
                                  )}
                                >
                                  {cd}
                                </div>
                              ) : (
                                <div
                                  className={cn(
                                    'font-semibold text-dark-muted',
                                    tier === 3 ? 'text-[11px]' : 'text-xs',
                                  )}
                                >
                                  {time}
                                </div>
                              )}
                            </div>
                            <div
                              className={cn(
                                'min-w-0 flex-1 truncate',
                                nameSize,
                                awayWin ? 'font-extrabold' : tier === 1 ? 'font-semibold' : 'font-normal',
                                isCompleted && !awayWin ? 'text-dark-muted' : 'bk-text-primary',
                              )}
                            >
                              {shortName(m.away?.name || '')}
                            </div>
                          </div>
                          {m.venue ? (
                            <div className="truncate px-2 pb-1.75 text-[9px] text-dark-muted">{m.venue}</div>
                          ) : null}
                        </div>
                      </a>
                    )
                  })}
                </div>
              )
            })}

            {isEmpty && (
              <div className="px-6 py-12 text-center">
                <div className="mb-1.5 text-sm font-bold bk-text-primary">Inga matcher den här dagen</div>
                {nextDate && activeDate !== nextDate && (
                  <button
                    type="button"
                    onClick={() => setActiveDate(nextDate)}
                    className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-gold"
                  >
                    Nästa: {fmtDate(nextDate)} →
                  </button>
                )}
              </div>
            )}

            {activeMatches.length > 0 && (
              <div className="px-5 py-4">
                <a
                  href="https://bits.swebowl.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-dark-muted no-underline"
                >
                  Fullständig info på BITS ↗
                </a>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {FUZZY_TAV.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-2 border-b border-light-border px-4 pt-3.5 pb-1.5 dark:border-dark-border">
              <div className="h-[5px] w-[5px] shrink-0 rotate-45 rounded-[1px] bg-gold" />
              <span className="text-[10px] font-extrabold tracking-widest text-dark-muted">
                KOMMANDE TÄVLINGAR
              </span>
            </div>
            {(showAllFuzzy ? FUZZY_TAV : FUZZY_TAV.slice(0, 2)).map(t => (
              <SchemaTavCard key={t.id} t={t} activeDate={activeDate} />
            ))}
            {!showAllFuzzy && FUZZY_TAV.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllFuzzy(true)}
                className="flex w-full cursor-pointer items-center gap-1 border-0 border-t border-light-border bg-transparent px-4 py-3 [-webkit-tap-highlight-color:transparent] dark:border-dark-border"
              >
                <span className="text-xs font-bold text-gold">Visa alla tävlingar</span>
                <span className="text-xs text-dark-muted">+{FUZZY_TAV.length - 2} till →</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
