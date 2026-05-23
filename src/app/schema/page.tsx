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
  id: string; name: string; subtitle: string; date: string; venue: string
  status: 'pagaende' | 'kommande' | 'avslutad'
  href: string; buttonLabel: string
  officialHref?: string
  extraButtons?: { label: string; href: string }[]
}

// ── Static tävlingar data ─────────────────────────────────────────────────────
const TAVLINGAR: Tavling[] = [
  {
    id: 'sm-slutspel-2026', name: 'SM-slutspel 2026',
    subtitle: 'Semifinaler och final i Elitserien Herrar och Damer',
    date: '15-17 maj 2026', venue: 'Lucky Bowl, Helsingborg',
    status: 'pagaende', href: '/schema', buttonLabel: 'Se matcher',
  },
  {
    id: 'sllm-2026', name: 'Storm Lucky Larsen Masters 2026',
    subtitle: 'Internationell PBA Tour-tävling — Sveriges största öppna turnering',
    date: '22-30 aug 2026', venue: 'Lucky Bowl, Helsingborg',
    status: 'kommande', href: '/sllm', officialHref: 'https://www.luckylarsen.se',
    buttonLabel: 'Mer info',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://sbe.bowlres.se/sllm26' },
      { label: 'Livestream', href: 'https://www.youtube.com/@stormluckylarsenmasters' },
    ],
  },
  {
    id: 'aikt-2026', name: 'MOTIV AIK International Tournament 2026',
    subtitle: 'Internationell öppen tävling i Stockholm — no urethane rule',
    date: 'Jan 2026', venue: 'Bowlorama, Stockholm',
    status: 'avslutad', href: 'https://aikt.aikbowling.se',
    officialHref: 'https://aikt.aikbowling.se', buttonLabel: 'Officiell sida',
    extraButtons: [
      { label: 'Resultat', href: 'https://aikt.aikbowling.se/allresults.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@bowloramatv' },
    ],
  },
  {
    id: 'syt-2026', name: 'PBA jr. Swedish Youth Tour 2026',
    subtitle: 'Ungdomstour i tre deltävlingar — U16, U21 killar och tjejer',
    date: '2025/2026', venue: 'Olympia, Nassjo, Gullmarsplan',
    status: 'pagaende', href: 'https://syt.bowlres.se',
    officialHref: 'https://syt.bowlres.se', buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://syt.bowlres.se/allresults.php' },
      { label: 'Anmäl dig', href: 'https://syt.bowlres.se/register.php' },
    ],
  },
  {
    id: 'battle-of-smaland-2026', name: 'The Battle of Småland 2026',
    subtitle: 'Sveriges största och billigaste sommartävling — prissumma 53 000 kr',
    date: 'Sommar 2026', venue: 'RC Bowl, Jönköping',
    status: 'kommande', href: 'https://rc-bowl.bowlres.se',
    officialHref: 'https://rc-bowl.bowlres.se', buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Anmäl dig', href: 'https://rc-bowl.bowlres.se/register.php' },
      { label: 'Livestream', href: 'https://www.youtube.com/@RcBowllive' },
    ],
  },
  {
    id: 'gp-2026', name: 'Challenger Grand Prix 2025/2026',
    subtitle: 'Individuell ungdomstour i Stockholm — 6 deltävlingar och tourfinal',
    date: 'Final: 16-17 maj 2026', venue: 'Sollentuna',
    status: 'pagaende', href: 'https://gp.stbf.se',
    officialHref: 'https://gp.stbf.se', buttonLabel: 'Se tävlingen',
    extraButtons: [
      { label: 'Resultat', href: 'https://gp.stbf.se/allresults.php' },
      { label: 'Barometer', href: 'https://gp.stbf.se/standings.php' },
    ],
  },
  {
    id: 'aikl-2026', name: 'MOTIV AIK Ladies 2026',
    subtitle: 'Öppen damtävling i Stockholm',
    date: '2026', venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikl.aikbowling.se',
    officialHref: 'https://aikl.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikj-2026', name: 'MOTIV AIK Junior 2026',
    subtitle: 'Öppen juniortävling i Stockholm',
    date: '2026', venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikj.aikbowling.se',
    officialHref: 'https://aikj.aikbowling.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'qak-2026', name: 'Queens and Kings 2026',
    subtitle: 'Öppen tävling',
    date: '2026', venue: 'Sverige',
    status: 'kommande', href: 'https://qak.bowlres.se',
    officialHref: 'https://qak.bowlres.se', buttonLabel: 'Officiell sida',
  },
  {
    id: 'aikmix-2026', name: 'AIK-mixen 2026',
    subtitle: 'Öppen mixedtävling i Stockholm',
    date: '2026', venue: 'Bowlorama, Stockholm',
    status: 'kommande', href: 'https://aikmix.aikbowling.se',
    officialHref: 'https://aikmix.aikbowling.se', buttonLabel: 'Officiell sida',
  },
]

// ── Division helpers ──────────────────────────────────────────────────────────
const DIVISION_TIERS: Record<string, number> = {
  'Elitserien Herrar': 1, 'Elitserien Damer': 1,
  'SM-slutspel Herrar': 1, 'SM-slutspel Damer': 1,
  'Mellanallsvenskan Herrar': 2, 'Nordallsvenskan Herrar': 2,
  'Sydallsvenskan Herrar': 2, 'Norra Allsvenskan Herrar': 2,
  'Södra Allsvenskan Herrar': 2,
}

function getTier(division: string): number {
  return DIVISION_TIERS[division] || 3
}

function getDivColor(division: string): string {
  if (division.includes('SM'))        return 'hsl(44, 50%, 52%)'
  if (division.includes('Elitserien') && division.includes('Damer')) return 'hsl(320, 30%, 58%)'
  if (division.includes('Elitserien')) return 'hsl(210, 35%, 55%)'
  if (getTier(division) === 2)        return 'hsl(130, 22%, 50%)'
  return 'hsl(35, 12%, 52%)'
}

function matchTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function cdStr(dateStr: string, now: number): string | null {
  const ms = Math.max(0, new Date(dateStr).getTime() - now)
  if (ms <= 0) return null
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
  const C = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [matches, setMatches]     = useState<Match[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [filter, setFilter]       = useState<'all' | 'elite' | 'allsvenskan' | 'div1'>('all')
  const [mainTab, setMainTab]     = useState<'liga' | 'tavlingar'>('liga')
  const [tabDir, setTabDir]       = useState(1)
  const [tavFilter, setTavFilter] = useState<'alla' | 'pagaende' | 'kommande' | 'avslutad'>('alla')
  const [now, setNow]             = useState(Date.now())

  const scrollRef     = useRef<HTMLDivElement>(null)
  const activeDateRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
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
          const today = new Date().toISOString().slice(0, 10)
          const allDates = [...new Set((data as any[]).map((m: any) => m.date.slice(0, 10)))].sort()
          const params = new URLSearchParams(window.location.search)
          const dateParam = params.get('date')
          if (dateParam && allDates.includes(dateParam)) setActiveDate(dateParam)
          else {
            const upcoming = allDates.find(d => d >= today)
            setActiveDate(upcoming || allDates[allDates.length - 1] || null)
          }
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (activeDateRef.current && scrollRef.current) {
      setTimeout(() => {
        const el = activeDateRef.current!
        const container = scrollRef.current!
        container.scrollTo({ left: el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
      }, 150)
    }
  }, [activeDate, loading])

  const today  = new Date().toISOString().slice(0, 10)
  const days   = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const dates  = [...new Set(matches.map(m => m.date.slice(0, 10)))].sort()

  const filterMatches = (ms: Match[]) => {
    if (filter === 'elite')      return ms.filter(m => getTier(m.division) === 1)
    if (filter === 'allsvenskan') return ms.filter(m => getTier(m.division) === 2)
    if (filter === 'div1')       return ms.filter(m => getTier(m.division) === 3)
    return ms
  }

  const activeMatches = activeDate
    ? filterMatches(matches.filter(m => m.date.slice(0, 10) === activeDate))
        .sort((a, b) => getTier(a.division) - getTier(b.division))
    : []

  const divisions = [...new Set(activeMatches.map(m => m.division))]
    .sort((a, b) => getTier(a) - getTier(b))

  const countOnDate = (dateKey: string, f: typeof filter) => {
    const dayMatches = matches.filter(m => m.date.slice(0, 10) === dateKey)
    if (f === 'elite')       return dayMatches.filter(m => getTier(m.division) === 1).length
    if (f === 'allsvenskan') return dayMatches.filter(m => getTier(m.division) === 2).length
    if (f === 'div1')        return dayMatches.filter(m => getTier(m.division) === 3).length
    return dayMatches.length
  }

  const switchTab = (t: 'liga' | 'tavlingar') => {
    if (t === mainTab) return
    setTabDir(t === 'tavlingar' ? 1 : -1)
    setMainTab(t)
  }

  const filteredTav = tavFilter === 'alla'
    ? TAVLINGAR
    : TAVLINGAR.filter(t => t.status === tavFilter)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted }}>Laddar...</div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sticky header ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 56, background: C.bg, zIndex: 30, borderBottom: '1px solid ' + C.border }}>

        {/* LIGA / TÄVLINGAR tab bar */}
        <div style={{ display: 'flex', padding: '0 4px', borderBottom: '1px solid ' + C.border }}>
          {(['liga', 'tavlingar'] as const).map(t => (
            <button key={t} onClick={() => switchTab(t)}
              style={{ fontSize: 11, fontWeight: 800, background: 'transparent', border: 'none',
                borderBottom: `2px solid ${mainTab === t ? C.accent : 'transparent'}`,
                color: mainTab === t ? C.accent : C.textMuted,
                padding: '10px 14px 8px', cursor: 'pointer', letterSpacing: 1,
                WebkitTapHighlightColor: 'transparent' } as any}>
              {t === 'liga' ? 'LIGA' : 'TÄVLINGAR'}
            </button>
          ))}
        </div>

        {/* Liga controls */}
        {mainTab === 'liga' && (
          <>
            {/* Date strip */}
            <div ref={scrollRef} style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex' } as any}>
              {dates.map(dateKey => {
                const d        = new Date(dateKey + 'T12:00:00')
                const isActive = dateKey === activeDate
                const isToday  = dateKey === today
                const isPast   = dateKey < today
                const count    = countOnDate(dateKey, filter)
                return (
                  <button key={dateKey} ref={isActive ? activeDateRef : null}
                    onClick={() => setActiveDate(dateKey)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '8px 12px 5px', border: 'none',
                      borderBottom: '2px solid ' + (isActive ? C.accent : 'transparent'),
                      background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                      opacity: isPast && !isActive ? 0.32 : 1, gap: 1,
                      WebkitTapHighlightColor: 'transparent' } as any}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1,
                      color: isActive ? C.accent : C.textMuted }}>
                      {isToday ? 'IDAG' : days[d.getDay()].toUpperCase()}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 400,
                      color: isActive ? C.accent : C.text }}>
                      {d.getDate()} {months[d.getMonth()]}
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 700, lineHeight: 1.2, minHeight: 10,
                      color: isActive ? C.accent : C.textMuted, opacity: count > 0 ? 1 : 0 }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Filter pills with live counts */}
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '8px 16px' } as any}>
              {([
                { key: 'all',          label: 'Alla' },
                { key: 'elite',        label: 'Elitserien' },
                { key: 'allsvenskan',  label: 'Allsvenskan' },
                { key: 'div1',         label: 'Division 1' },
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
          </>
        )}

        {/* Tävlingar filter */}
        {mainTab === 'tavlingar' && (
          <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '10px 16px' } as any}>
            {([
              { key: 'alla',     label: 'Alla' },
              { key: 'pagaende', label: 'Pågående' },
              { key: 'kommande', label: 'Kommande' },
              { key: 'avslutad', label: 'Avslutade' },
            ] as const).map(f => {
              const isActive = tavFilter === f.key
              const count    = f.key === 'alla' ? TAVLINGAR.length : TAVLINGAR.filter(t => t.status === f.key).length
              return (
                <button key={f.key} onClick={() => setTavFilter(f.key)}
                  style={{ background: isActive ? C.accent : 'transparent',
                    border: '1px solid ' + (isActive ? C.accent : C.border),
                    borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                    color: isActive ? '#1a1400' : C.textMuted, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    WebkitTapHighlightColor: 'transparent' } as any}>
                  {f.label} · {count}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Animated content ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait" custom={tabDir}>
        <motion.div
          key={mainTab}
          custom={tabDir}
          initial={{ x: tabDir > 0 ? 36 : -36, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ opacity: 0, x: tabDir > 0 ? -12 : 12 }}
          transition={SPRING}
        >

          {/* ── LIGA content ──────────────────────────────────────────────────── */}
          {mainTab === 'liga' && (
            <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>
              {activeMatches.length === 0 && (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                  Inga matcher den här dagen
                </div>
              )}

              {divisions.map(div => {
                const divMatches = activeMatches.filter(m => m.division === div)
                const dc         = getDivColor(div)
                const round      = divMatches[0]?.round

                return (
                  <div key={div}>
                    {/* Division header */}
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
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center',
                            padding: '10px 8px', gap: 8 }}>

                            {/* Home */}
                            <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: homeWin ? 700 : 400,
                              color: isCompleted ? (homeWin ? C.text : C.textMuted) : C.text,
                              textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {shortName(m.home?.name || '')}
                            </div>

                            {/* Center */}
                            <div style={{ flexShrink: 0, width: 68, display: 'flex',
                              flexDirection: 'column', alignItems: 'center' }}>
                              {isLive && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%',
                                    background: '#e05555', display: 'inline-block',
                                    boxShadow: '0 0 4px #e05555' }} />
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

                            {/* Away */}
                            <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: awayWin ? 700 : 400,
                              color: isCompleted ? (awayWin ? C.text : C.textMuted) : C.text,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {shortName(m.away?.name || '')}
                            </div>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                )
              })}

              {activeMatches.length > 0 && (
                <div style={{ padding: '16px 20px' }}>
                  <a href="https://bits.swebowl.se" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none' }}>
                    Fullständig info på BITS ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── TÄVLINGAR content ─────────────────────────────────────────────── */}
          {mainTab === 'tavlingar' && (
            <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>
              {filteredTav.map(t => {
                const isLive = t.status === 'pagaende'
                const dc     = isLive ? '#e05555' : t.status === 'kommande' ? C.accent : C.textMuted
                return (
                  <div key={t.id} style={{ borderBottom: '1px solid ' + C.border, padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      {/* Status dot */}
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dc,
                        flexShrink: 0, marginTop: 5,
                        boxShadow: isLive ? '0 0 6px #e05555' : 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 5 }}>
                          {t.subtitle}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>
                          {t.date} · {t.venue}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, flexShrink: 0,
                        borderRadius: 6, padding: '3px 8px', marginTop: 1,
                        background: isLive ? 'rgba(224,85,85,0.12)' : t.status === 'kommande' ? (isDark ? 'rgba(245,194,0,0.10)' : 'rgba(245,194,0,0.12)') : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                        color: dc }}>
                        {isLive ? 'PÅGÅENDE' : t.status === 'kommande' ? 'KOMMANDE' : 'AVSLUTAD'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                      <a href={t.href}
                        style={{ fontSize: 12, fontWeight: 700, color: '#1a1400',
                          background: C.accent, borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
                        {t.buttonLabel}
                      </a>
                      {t.officialHref && t.officialHref !== t.href && (
                        <a href={t.officialHref} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, fontWeight: 700, color: C.textMuted,
                            border: '1px solid ' + C.border, borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
                          Officiell sida ↗
                        </a>
                      )}
                      {t.extraButtons?.map(b => (
                        <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, fontWeight: 700, color: C.textMuted,
                            border: '1px solid ' + C.border, borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
                          {b.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </main>
  )
}
