'use client'

// Atlas — the season as a zoomable mosaic. Tiles, not lists: size = hierarchy + heat.
// Zoom levels: Sverige → division (months + teams) → round matches / team heat map.

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { shortName, teamInitials } from '@/lib/utils'
import { DIVISIONS, divisionTier, divisionColor, divisionShort, hexAlpha } from '@/lib/divisions'
import { mondayOf } from '@/lib/weeks'
import { TAVLINGAR, TAV_MAP, type Tavling } from '@/lib/tavlingar'
import { motion, AnimatePresence } from 'framer-motion'

const GOLD   = '#f5c200'
const SPRING = { type: 'spring', stiffness: 280, damping: 30 } as const
const MONTHS = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
const MONTHS_S = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const DAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']

type Team = { id: string; name: string }
type Match = {
  id: string; date: string; status: string; round: number
  home_score: number | null; away_score: number | null
  venue: string; division: string
  home_team_id: string; away_team_id: string
  home: Team; away: Team
}

type Level =
  | { type: 'root' }
  | { type: 'division'; div: string }
  | { type: 'month'; div: string; month: string }  // month = 'YYYY-MM'
  | { type: 'team'; div: string; teamId: string }
  | { type: 'tav' }

export default function AtlasPage() {
  const { theme } = useTheme()
  const C      = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [path, setPath]       = useState<Level[]>([{ type: 'root' }])

  const level = path[path.length - 1]
  const push  = (l: Level) => setPath(p => [...p, l])
  const pop   = () => setPath(p => (p.length > 1 ? p.slice(0, -1) : p))

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

  const today   = new Date().toISOString().slice(0, 10)
  const curWeek = mondayOf(today)

  // ── Derived model ───────────────────────────────────────────────────────────
  const model = useMemo(() => {
    const divisions = [...new Set(matches.map(m => m.division))]
    const regIdx = (d: string) => {
      const i = DIVISIONS.findIndex(x => x.name === d)
      return i < 0 ? 999 : i
    }
    divisions.sort((a, b) => divisionTier(a) - divisionTier(b) || regIdx(a) - regIdx(b))

    const byDiv = new Map<string, Match[]>()
    divisions.forEach(d => byDiv.set(d, []))
    matches.forEach(m => byDiv.get(m.division)?.push(m))

    const live = matches.filter(m => m.status === 'live')
    return { divisions, byDiv, live }
  }, [matches])

  const divMatches = (div: string) => model.byDiv.get(div) ?? []

  const isHotDiv = (div: string) => {
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    return divMatches(div).some(m => {
      const d = m.date.slice(0, 10)
      return m.status === 'live' || (d >= today && d <= in7)
    })
  }
  const hasLiveDiv = (div: string) => divMatches(div).some(m => m.status === 'live')

  const nextMatchOf = (ms: Match[]) => ms.find(m => m.date.slice(0, 10) >= today && m.home_score === null)

  // Season week intensities for a set of matches → micro heat strip (bucketed)
  const heatStrip = (ms: Match[], buckets = 14): { v: number; past: boolean }[] => {
    if (ms.length === 0) return []
    const weeks = [...new Set(ms.map(m => mondayOf(m.date.slice(0, 10))))].sort()
    if (weeks.length === 0) return []
    const perWeek = new Map<string, number>()
    ms.forEach(m => {
      const wk = mondayOf(m.date.slice(0, 10))
      perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1)
    })
    const n = Math.min(buckets, weeks.length)
    const out: { v: number; past: boolean }[] = []
    for (let i = 0; i < n; i++) {
      const slice = weeks.slice(Math.floor(i * weeks.length / n), Math.floor((i + 1) * weeks.length / n))
      const count = slice.reduce((s, wk) => s + (perWeek.get(wk) ?? 0), 0)
      out.push({ v: count, past: slice[slice.length - 1] < curWeek })
    }
    const max = Math.max(1, ...out.map(o => o.v))
    return out.map(o => ({ v: o.v / max, past: o.past }))
  }

  const fmtNext = (m: Match) => {
    const d = new Date(m.date)
    return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS_S[d.getMonth()]} · ${d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '48px 24px', textAlign: 'center', color: C.textMuted }}>Laddar atlas...</div>
    </main>
  )

  // ── Shared tile chrome ──────────────────────────────────────────────────────
  const tileBase = (color: string, hot: boolean): React.CSSProperties => ({
    position: 'relative', borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
    border: `1px solid ${hexAlpha(color, hot ? 0.55 : 0.28)}`,
    background: isDark
      ? `linear-gradient(145deg, ${hexAlpha(color, hot ? 0.22 : 0.12)}, ${hexAlpha(color, 0.04)})`
      : `linear-gradient(145deg, ${hexAlpha(color, hot ? 0.16 : 0.09)}, ${hexAlpha(color, 0.02)})`,
    boxShadow: hot ? `0 0 18px ${hexAlpha(color, 0.25)}` : 'none',
    WebkitTapHighlightColor: 'transparent',
    textAlign: 'left', padding: 0, display: 'block', width: '100%',
  })

  const MicroHeat = ({ strip, color }: { strip: { v: number; past: boolean }[]; color: string }) => (
    <div style={{ display: 'flex', gap: 2.5, alignItems: 'flex-end' }}>
      {strip.map((s, i) => (
        <div key={i} style={{ flex: 1, maxWidth: 10, borderRadius: 2,
          height: 4 + s.v * 10,
          background: s.v === 0
            ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
            : hexAlpha(color, (0.25 + s.v * 0.75) * (s.past ? 0.35 : 1)) }} />
      ))}
    </div>
  )

  // ── LEVEL 0: Sverige — the mosaic ───────────────────────────────────────────
  const RootLevel = () => {
    const upcomingTavs = TAVLINGAR.filter(t => t.status !== 'avslutad')
    const tavHot = [...TAV_MAP.keys()].some(d => mondayOf(d) === curWeek)

    const DivTile = ({ div, size }: { div: string; size: 'l' | 'm' | 's' }) => {
      const ms    = divMatches(div)
      const color = divisionColor(div)
      const hot   = isHotDiv(div)
      const live  = hasLiveDiv(div)
      const next  = nextMatchOf(ms)
      const strip = heatStrip(ms, size === 's' ? 8 : 14)
      return (
        <motion.button layoutId={'tile-div-' + div} onClick={() => push({ type: 'division', div })}
          whileTap={{ scale: 0.97 }} transition={SPRING}
          style={{ ...tileBase(color, hot), gridColumn: size === 's' ? 'span 1' : 'span 2',
            aspectRatio: size === 'l' ? '1.05' : size === 'm' ? '1.9' : '1' } as any}>
          <div style={{ position: 'absolute', inset: 0, padding: size === 's' ? 10 : 14,
            display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {live && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e05555',
                  boxShadow: '0 0 6px #e05555' }} />
              )}
              <span style={{ fontSize: size === 's' ? 10 : 12, fontWeight: 800, color: C.text,
                lineHeight: 1.15 }}>
                {size === 's' ? divisionShort(div) : div}
              </span>
            </div>
            {size !== 's' && next && (
              <span style={{ fontSize: 9.5, color: C.textMuted, marginTop: 3 }}>
                Nästa: {fmtNext(next)}
              </span>
            )}
            {live && size !== 's' && (
              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#e05555', marginTop: 3 }}>
                LIVE just nu
              </span>
            )}
            <div style={{ marginTop: 'auto' }}>
              <MicroHeat strip={strip} color={color} />
            </div>
          </div>
        </motion.button>
      )
    }

    const tier1 = model.divisions.filter(d => divisionTier(d) === 1)
    const tier2 = model.divisions.filter(d => divisionTier(d) === 2)
    const tier3 = model.divisions.filter(d => divisionTier(d) === 3)

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '4px 12px 32px' }}>

        {/* Live hero — only exists while something is live: the hottest tile */}
        {model.live.length > 0 && (
          <motion.button layoutId="tile-live" whileTap={{ scale: 0.98 }} transition={SPRING}
            onClick={() => push({ type: 'division', div: model.live[0].division })}
            style={{ ...tileBase('#e05555', true), gridColumn: 'span 4', aspectRatio: '3.2' } as any}>
            <div style={{ position: 'absolute', inset: 0, padding: 14, display: 'flex',
              flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e05555',
                  boxShadow: '0 0 8px #e05555' }} />
                <span style={{ fontSize: 10, fontWeight: 900, color: '#e05555', letterSpacing: 1.5 }}>
                  LIVE JUST NU
                </span>
              </div>
              {model.live.slice(0, 2).map(m => (
                <div key={m.id} style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  {shortName(m.home?.name || '')} <span style={{ color: C.accent }}>{m.home_score}–{m.away_score}</span> {shortName(m.away?.name || '')}
                </div>
              ))}
            </div>
          </motion.button>
        )}

        {tier1.map(d => <DivTile key={d} div={d} size="l" />)}

        {/* Tävlingar — gold tile */}
        {upcomingTavs.length > 0 && (
          <motion.button layoutId="tile-tav" whileTap={{ scale: 0.97 }} transition={SPRING}
            onClick={() => push({ type: 'tav' })}
            style={{ ...tileBase(GOLD, tavHot), gridColumn: 'span 2', aspectRatio: '1.9' } as any}>
            <div style={{ position: 'absolute', inset: 0, padding: 14, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, transform: 'rotate(45deg)', background: GOLD }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>Tävlingar</span>
              </div>
              <span style={{ fontSize: 9.5, color: C.textMuted, marginTop: 3 }}>
                {upcomingTavs.length} pågående & kommande
              </span>
              <div style={{ marginTop: 'auto', display: 'flex', gap: 3 }}>
                {upcomingTavs.slice(0, 8).map(t => (
                  <div key={t.id} style={{ width: 8, height: 8, borderRadius: 2, transform: 'rotate(45deg)',
                    background: hexAlpha(GOLD, t.status === 'pagaende' ? 1 : 0.4) }} />
                ))}
              </div>
            </div>
          </motion.button>
        )}

        {tier2.map(d => <DivTile key={d} div={d} size={isHotDiv(d) ? 'l' : 'm'} />)}
        {tier3.map(d => <DivTile key={d} div={d} size={isHotDiv(d) ? 'm' : 's'} />)}
      </div>
    )
  }

  // ── LEVEL 1: a division — months mosaic + team tiles ────────────────────────
  const DivisionLevel = ({ div }: { div: string }) => {
    const ms    = divMatches(div)
    const color = divisionColor(div)
    const curMonth = today.slice(0, 7)

    const months = [...new Set(ms.map(m => m.date.slice(0, 7)))].sort()
    const perMonth = new Map<string, Match[]>()
    months.forEach(mo => perMonth.set(mo, ms.filter(m => m.date.slice(0, 7) === mo)))
    const maxMonth = Math.max(1, ...months.map(mo => perMonth.get(mo)!.length))

    // Teams with W-L records
    const teams = new Map<string, { team: Team; w: number; l: number; d: number }>()
    ms.forEach(m => {
      ;[m.home, m.away].forEach(t => {
        if (t && !teams.has(t.id)) teams.set(t.id, { team: t, w: 0, l: 0, d: 0 })
      })
      if (m.home_score === null) return
      const h = teams.get(m.home?.id), a = teams.get(m.away?.id)
      if (!h || !a) return
      if (m.home_score! > m.away_score!) { h.w++; a.l++ }
      else if (m.home_score! < m.away_score!) { a.w++; h.l++ }
      else { h.d++; a.d++ }
    })
    const teamList = [...teams.values()].sort((x, y) => y.w - x.w)

    return (
      <motion.div layoutId={'tile-div-' + div} transition={SPRING}
        style={{ margin: '4px 12px 32px', borderRadius: 18, overflow: 'hidden',
          border: `1px solid ${hexAlpha(color, 0.35)}`,
          background: isDark ? hexAlpha(color, 0.05) : hexAlpha(color, 0.04) }}>
        <div style={{ height: 3, background: color }} />
        <div style={{ padding: '14px 14px 6px' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{div}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
            {ms.length} matcher · {teamList.length} lag
          </div>
        </div>

        {/* Months mosaic — current month is the big one */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '8px 12px' }}>
          {months.map(mo => {
            const mms   = perMonth.get(mo)!
            const heat  = mms.length / maxMonth
            const isCur = mo === curMonth
            const past  = mo < curMonth
            const big   = isCur || heat > 0.85
            const played = mms.filter(m => m.home_score !== null).length
            return (
              <motion.button key={mo} layoutId={'tile-month-' + div + mo} transition={SPRING}
                whileTap={{ scale: 0.96 }}
                onClick={() => push({ type: 'month', div, month: mo })}
                style={{ ...tileBase(color, isCur), gridColumn: big ? 'span 2' : 'span 1',
                  aspectRatio: big ? '1.9' : '1', opacity: past && !isCur ? 0.55 : 1 } as any}>
                <div style={{ position: 'absolute', inset: 0, padding: 10, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: big ? 12 : 10, fontWeight: 800, color: C.text }}>
                    {MONTHS[+mo.slice(5, 7) - 1]}
                  </span>
                  <span style={{ fontSize: 9, color: C.textMuted }}>{mo.slice(0, 4)}</span>
                  <span style={{ marginTop: 'auto', fontSize: big ? 16 : 12, fontWeight: 900,
                    color: hexAlpha(color, 0.4 + heat * 0.6) }}>
                    {mms.length}
                  </span>
                  {big && (
                    <span style={{ fontSize: 8.5, color: C.textMuted }}>
                      {played < mms.length ? `${mms.length - played} kvar att spela` : 'färdigspelad'}
                    </span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Team tiles — each opens the team's heat map */}
        <div style={{ padding: '8px 12px 16px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: C.textMuted,
            padding: '6px 2px' }}>
            LAG — TRYCK FÖR VÄRMEKARTA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {teamList.map(({ team, w, l, d }) => {
              const total = w + l + d
              const ratio = total > 0 ? w / total : 0
              return (
                <motion.button key={team.id} layoutId={'tile-team-' + team.id} transition={SPRING}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => push({ type: 'team', div, teamId: team.id })}
                  style={{ ...tileBase(color, false), aspectRatio: '1' } as any}>
                  <div style={{ position: 'absolute', inset: 0, padding: 8, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: C.text }}>
                      {teamInitials(team.name)}
                    </span>
                    <span style={{ fontSize: 8.5, color: C.textMuted, textAlign: 'center',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                      {shortName(team.name)}
                    </span>
                    {total > 0 && (
                      <div style={{ width: '80%', height: 3, borderRadius: 2, overflow: 'hidden',
                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
                        <div style={{ width: `${ratio * 100}%`, height: '100%', background: C.green }} />
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>
    )
  }

  // ── LEVEL 2a: a month in a division — rounds & matches (the leaf list) ──────
  const MonthLevel = ({ div, month }: { div: string; month: string }) => {
    const color = divisionColor(div)
    const ms = divMatches(div).filter(m => m.date.slice(0, 7) === month)
      .sort((a, b) => a.date.localeCompare(b.date))
    const rounds: [number, Match[]][] = []
    ms.forEach(m => {
      const last = rounds[rounds.length - 1]
      if (last && last[0] === m.round) last[1].push(m)
      else rounds.push([m.round, [m]])
    })
    return (
      <motion.div layoutId={'tile-month-' + div + month} transition={SPRING}
        style={{ margin: '4px 12px 32px', borderRadius: 18, overflow: 'hidden',
          border: `1px solid ${hexAlpha(color, 0.35)}`, background: C.surface }}>
        <div style={{ height: 3, background: color }} />
        <div style={{ padding: '14px 14px 4px' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>
            {MONTHS[+month.slice(5, 7) - 1].charAt(0).toUpperCase() + MONTHS[+month.slice(5, 7) - 1].slice(1)} {month.slice(0, 4)}
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{div}</div>
        </div>
        {rounds.map(([round, rms]) => (
          <div key={round}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: 1 }}>
                OMGÅNG {round}
              </span>
              <span style={{ fontSize: 9, color: C.textMuted }}>
                {(() => { const d = new Date(rms[0].date); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS_S[d.getMonth()]}` })()}
              </span>
            </div>
            {rms.map(m => {
              const done    = m.home_score !== null
              const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0)
              const awayWin = (m.away_score ?? 0) > (m.home_score ?? 0)
              return (
                <a key={m.id} href={'/matches/' + m.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
                    textDecoration: 'none', WebkitTapHighlightColor: 'transparent' } as any}>
                  <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: hexAlpha(color, 0.6) }} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, textAlign: 'right',
                    fontWeight: homeWin ? 700 : 400,
                    color: done && !homeWin ? C.textMuted : C.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {shortName(m.home?.name || '')}
                  </div>
                  <div style={{ flexShrink: 0, width: 56, textAlign: 'center' }}>
                    {m.status === 'live' ? (
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#e05555' }}>
                        {m.home_score}–{m.away_score}
                      </span>
                    ) : done ? (
                      <span style={{ fontSize: 13, fontWeight: 900, color: C.text }}>
                        {m.home_score}–{m.away_score}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted }}>
                        {new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: awayWin ? 700 : 400,
                    color: done && !awayWin ? C.textMuted : C.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {shortName(m.away?.name || '')}
                  </div>
                </a>
              )
            })}
          </div>
        ))}
        <div style={{ height: 12 }} />
      </motion.div>
    )
  }

  // ── LEVEL 2b: a team — full season heat map of wins/losses ──────────────────
  const TeamLevel = ({ div, teamId }: { div: string; teamId: string }) => {
    const color = divisionColor(div)
    const ms = divMatches(div)
      .filter(m => m.home?.id === teamId || m.away?.id === teamId)
      .sort((a, b) => a.date.localeCompare(b.date))
    const team = ms[0]?.home?.id === teamId ? ms[0]?.home : ms[0]?.away
    const results = ms.map(m => {
      const isHome = m.home?.id === teamId
      const my  = isHome ? m.home_score : m.away_score
      const opp = isHome ? m.away_score : m.home_score
      const res = m.home_score === null ? 'upcoming'
        : my! > opp! ? 'win' : my! < opp! ? 'loss' : 'draw'
      return { m, res, isHome, opp: isHome ? m.away : m.home, my, oppScore: opp }
    })
    const w = results.filter(r => r.res === 'win').length
    const l = results.filter(r => r.res === 'loss').length
    const d = results.filter(r => r.res === 'draw').length
    const resColor = (res: string) =>
      res === 'win' ? C.green : res === 'loss' ? C.red : res === 'draw' ? C.textMuted : 'transparent'

    return (
      <motion.div layoutId={'tile-team-' + teamId} transition={SPRING}
        style={{ margin: '4px 12px 32px', borderRadius: 18, overflow: 'hidden',
          border: `1px solid ${hexAlpha(color, 0.35)}`, background: C.surface }}>
        <div style={{ height: 3, background: color }} />
        <div style={{ padding: '14px 14px 10px' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{shortName(team?.name || '')}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
            {div} · <span style={{ color: C.green, fontWeight: 700 }}>{w}V</span>{' '}
            {d > 0 && <span>{d}O </span>}
            <span style={{ color: C.red, fontWeight: 700 }}>{l}F</span>
          </div>
        </div>

        {/* The heat map: one cell per round */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, padding: '0 14px 10px' }}>
          {results.map(({ m, res }) => (
            <a key={m.id} href={'/matches/' + m.id}
              title={`Omgång ${m.round}`}
              style={{ aspectRatio: '1', borderRadius: 6, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: res === 'upcoming'
                  ? 'transparent'
                  : hexAlpha(resColor(res).startsWith('#') ? resColor(res) : '#888888', 0.18),
                border: res === 'upcoming'
                  ? `1px dashed ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'}`
                  : `1px solid ${hexAlpha(resColor(res).startsWith('#') ? resColor(res) : '#888888', 0.4)}`,
                WebkitTapHighlightColor: 'transparent' } as any}>
              <span style={{ fontSize: 10, fontWeight: 900,
                color: res === 'upcoming' ? C.textMuted : resColor(res) }}>
                {res === 'win' ? 'V' : res === 'loss' ? 'F' : res === 'draw' ? 'O' : m.round}
              </span>
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 14px 14px', fontSize: 9, color: C.textMuted }}>
          <span><span style={{ color: C.green, fontWeight: 800 }}>V</span> vinst</span>
          <span><span style={{ color: C.red, fontWeight: 800 }}>F</span> förlust</span>
          <span>streckad = kommande (visar omgång)</span>
        </div>
      </motion.div>
    )
  }

  // ── Tävlingar level ─────────────────────────────────────────────────────────
  const TavLevel = () => {
    const ts = TAVLINGAR.filter(t => t.status !== 'avslutad')
    const order = { pagaende: 0, kommande: 1, avslutad: 2 } as const
    const sorted = [...ts].sort((a, b) =>
      order[a.status] - order[b.status] || (a.dateFrom ?? '9999').localeCompare(b.dateFrom ?? '9999'))
    return (
      <motion.div layoutId="tile-tav" transition={SPRING}
        style={{ margin: '4px 12px 32px', borderRadius: 18, overflow: 'hidden',
          border: `1px solid ${hexAlpha(GOLD, 0.35)}`, background: C.surface }}>
        <div style={{ height: 3, background: GOLD }} />
        <div style={{ padding: '14px 14px 6px' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>Tävlingar</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, padding: '4px 12px 16px' }}>
          {sorted.map((t: Tavling) => (
            <a key={t.id} href={t.href}
              style={{ ...tileBase(GOLD, t.status === 'pagaende'), aspectRatio: '1.35',
                textDecoration: 'none' } as any}>
              <div style={{ position: 'absolute', inset: 0, padding: 10, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 1,
                  color: t.status === 'pagaende' ? GOLD : C.textMuted }}>
                  {t.status === 'pagaende' ? 'PÅGÅENDE' : 'KOMMANDE'}
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.text, marginTop: 3, lineHeight: 1.25 }}>
                  {t.name}
                </span>
                <span style={{ marginTop: 'auto', fontSize: 8.5, color: C.textMuted }}>
                  {t.dateLabel} · {t.venue}
                </span>
              </div>
            </a>
          ))}
        </div>
      </motion.div>
    )
  }

  // ── Breadcrumb ──────────────────────────────────────────────────────────────
  const crumbs: string[] = ['Sverige']
  path.slice(1).forEach(l => {
    if (l.type === 'division') crumbs.push(divisionShort(l.div))
    if (l.type === 'month')    crumbs.push(MONTHS_S[+l.month.slice(5, 7) - 1])
    if (l.type === 'team') {
      const m = matches.find(x => x.home?.id === l.teamId || x.away?.id === l.teamId)
      const t = m?.home?.id === l.teamId ? m?.home : m?.away
      crumbs.push(teamInitials(t?.name || '?'))
    }
    if (l.type === 'tav') crumbs.push('Tävlingar')
  })

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Breadcrumb bar — the "altitude meter" */}
        <div style={{ position: 'sticky', top: 56, zIndex: 30, background: C.bg,
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
          borderBottom: '1px solid ' + C.border }}>
          {path.length > 1 && (
            <button onClick={pop}
              style={{ border: '1px solid ' + C.border, background: 'transparent', color: C.text,
                borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as any}>
              ←
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                {i > 0 && <span style={{ fontSize: 10, color: C.textMuted }}>›</span>}
                <button onClick={() => setPath(p => p.slice(0, i + 1))}
                  style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
                    fontSize: 12, fontWeight: i === crumbs.length - 1 ? 800 : 600,
                    color: i === crumbs.length - 1 ? C.text : C.textMuted,
                    WebkitTapHighlightColor: 'transparent' } as any}>
                  {c}
                </button>
              </span>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, letterSpacing: 2, color: C.textMuted }}>
            ATLAS
          </span>
        </div>

        <div style={{ paddingTop: 10 }}>
          <AnimatePresence mode="popLayout" initial={false}>
            {level.type === 'root' && (
              <motion.div key="root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RootLevel />
              </motion.div>
            )}
            {level.type === 'division' && (
              <motion.div key={'div-' + level.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DivisionLevel div={level.div} />
              </motion.div>
            )}
            {level.type === 'month' && (
              <motion.div key={'mo-' + level.month} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MonthLevel div={level.div} month={level.month} />
              </motion.div>
            )}
            {level.type === 'team' && (
              <motion.div key={'team-' + level.teamId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TeamLevel div={level.div} teamId={level.teamId} />
              </motion.div>
            )}
            {level.type === 'tav' && (
              <motion.div key="tav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TavLevel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
