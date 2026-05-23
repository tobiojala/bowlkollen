'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { motion } from 'framer-motion'
import { shortName } from '@/lib/utils'

type Props = { params: Promise<{ id1: string; id2: string }> }

type Team = { id: string; name: string; city: string | null; division?: string }
type Match = {
  id: string; date: string; status: string
  home_score: number | null; away_score: number | null
  home_team_id: string; away_team_id: string
  home: { id: string; name: string }
  away: { id: string; name: string }
}

type TeamStats = {
  wins: number
  draws: number
  losses: number
  winRate: number
  avgMP: number
  bestMP: number
  matchesPlayed: number
}

type Metric = {
  label: string
  key: keyof TeamStats
  lowerIsBetter?: boolean
  format?: (v: number) => string
}

const METRICS: Metric[] = [
  { label: 'Vinstprocent',      key: 'winRate',        format: v => v + '%' },
  { label: 'Matcher vunna',     key: 'wins' },
  { label: 'Snitt matchpoäng',  key: 'avgMP',          format: v => v.toFixed(1) },
  { label: 'Bästa matchpoäng',  key: 'bestMP' },
  { label: 'Oavgjorda',         key: 'draws' },
  { label: 'Matcher förlorade', key: 'losses',         lowerIsBetter: true },
]

const SPRING    = { type: 'spring', stiffness: 280, damping: 28 } as const
const GOLD      = '#f5c200'
const GOLD_GLOW = 'rgba(245,194,0,0.40)'
const GOLD_CARD = 'rgba(245,194,0,0.08)'
const GOLD_RING = 'rgba(245,194,0,0.28)'

function teamPalette(name: string, isDark: boolean) {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return {
    border: `hsl(${hue},50%,45%)`,
    bg:     isDark ? `hsl(${hue},40%,12%)` : `hsl(${hue},40%,92%)`,
  }
}

function computeStats(matches: Match[], teamId: string): TeamStats {
  const done = matches.filter(m => m.home_score !== null && m.away_score !== null)
  const isHome = (m: Match) => m.home_team_id === teamId
  const wins   = done.filter(m => isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length
  const losses = done.filter(m => isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!).length
  const draws  = done.length - wins - losses
  const scores = done.map(m => isHome(m) ? m.home_score! : m.away_score!)
  const total  = scores.reduce((a, b) => a + b, 0)
  return {
    wins, draws, losses,
    winRate:       done.length > 0 ? Math.round((wins / done.length) * 100) : 0,
    avgMP:         done.length > 0 ? Math.round((total / done.length) * 10) / 10 : 0,
    bestMP:        scores.length > 0 ? Math.max(...scores) : 0,
    matchesPlayed: done.length,
  }
}

export default function TeamComparePage({ params }: Props) {
  const { theme } = useTheme()
  const C      = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [ids,     setIds]     = useState<{ id1: string; id2: string } | null>(null)
  const [t1,      setT1]      = useState<Team | null>(null)
  const [t2,      setT2]      = useState<Team | null>(null)
  const [stats1,  setStats1]  = useState<TeamStats | null>(null)
  const [stats2,  setStats2]  = useState<TeamStats | null>(null)
  const [h2h,     setH2h]     = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { params.then(p => setIds(p)) }, [params])

  useEffect(() => {
    if (!ids) return
    const supabase = createClient()
    Promise.all([
      supabase.from('teams').select('id,name,city').eq('id', ids.id1).single(),
      supabase.from('teams').select('id,name,city').eq('id', ids.id2).single(),
      supabase.from('matches')
        .select('id,date,status,home_score,away_score,home_team_id,away_team_id,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .eq('status', 'completed')
        .or(`home_team_id.eq.${ids.id1},away_team_id.eq.${ids.id1}`),
      supabase.from('matches')
        .select('id,date,status,home_score,away_score,home_team_id,away_team_id,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .eq('status', 'completed')
        .or(`home_team_id.eq.${ids.id2},away_team_id.eq.${ids.id2}`),
      supabase.from('matches')
        .select('id,date,home_score,away_score,home_team_id,away_team_id,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .not('home_score', 'is', null)
        .or(`and(home_team_id.eq.${ids.id1},away_team_id.eq.${ids.id2}),and(home_team_id.eq.${ids.id2},away_team_id.eq.${ids.id1})`)
        .order('date', { ascending: false })
        .limit(10),
    ]).then(([{ data: team1 }, { data: team2 }, { data: m1 }, { data: m2 }, { data: h2hData }]) => {
      if (team1) setT1(team1 as Team)
      if (team2) setT2(team2 as Team)
      setStats1(m1 ? computeStats(m1 as unknown as Match[], ids.id1) : null)
      setStats2(m2 ? computeStats(m2 as unknown as Match[], ids.id2) : null)
      setH2h((h2hData || []) as unknown as Match[])
      setLoading(false)
    })
  }, [ids])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
        style={{ fontSize: 13, color: C.textMuted }}>Laddar jämförelse...</motion.div>
    </main>
  )

  if (!t1 || !t2 || !stats1 || !stats2) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.textMuted }}>Lag hittades inte</div>
    </main>
  )

  const col1 = teamPalette(t1.name, isDark)
  const col2 = teamPalette(t2.name, isDark)
  const ini1 = shortName(t1.name).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
  const ini2 = shortName(t2.name).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()

  // Count categories won by each team
  const t1Wins = METRICS.filter(m => {
    const v1 = stats1[m.key] as number, v2 = stats2[m.key] as number
    return m.lowerIsBetter ? v1 < v2 : v1 > v2
  }).length
  const t2Wins = METRICS.filter(m => {
    const v1 = stats1[m.key] as number, v2 = stats2[m.key] as number
    return m.lowerIsBetter ? v2 < v1 : v2 > v1
  }).length
  const overall = t1Wins > t2Wins ? 1 : t2Wins > t1Wins ? 2 : 0

  // Win probability bar (based on win rate, clamped 5-95%)
  const total = stats1.winRate + stats2.winRate
  const prob1 = total === 0 ? 50 : Math.round(Math.min(95, Math.max(5, (stats1.winRate / total) * 100)))
  const prob2 = 100 - prob1

  // H2H record between the two
  const h2hWins1 = h2h.filter(m => m.home_team_id === ids!.id1 ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length
  const h2hWins2 = h2h.filter(m => m.home_team_id === ids!.id2 ? m.home_score! > m.away_score! : m.away_score! > m.home_score!).length
  const h2hDraws = h2h.length - h2hWins1 - h2hWins2

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Back */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
        <a href="/teams" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
          background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '5px 12px' }}>
          ← Alla lag
        </a>
      </div>

      {/* Split-screen hero */}
      <div style={{ position: 'relative', height: 220, display: 'flex', overflow: 'hidden' }}>

        {/* Team 1 */}
        <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...SPRING, delay: 0.05 }}
          style={{
            flex: 1,
            background: isDark
              ? `linear-gradient(135deg, ${col1.bg} 0%, rgba(11,21,40,0.95) 100%)`
              : `linear-gradient(135deg, ${col1.bg} 0%, rgba(235,240,250,0.98) 100%)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '40px 40px 20px 20px',
          }}>
          <a href={`/teams/${t1.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: col1.bg, border: `2.5px solid ${col1.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: col1.border }}>
              {ini1}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>
                {shortName(t1.name).split(' ').slice(0, -1).join(' ') || shortName(t1.name)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: col1.border }}>
                {shortName(t1.name).split(' ').slice(-1)[0]}
              </div>
              {t1.city && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{t1.city}</div>}
            </div>
          </a>
          {overall === 1 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SPRING, delay: 0.6 }}
              style={{ fontSize: 9, fontWeight: 800, color: GOLD, background: GOLD_CARD,
                border: `1px solid ${GOLD_RING}`, borderRadius: 20, padding: '3px 10px', letterSpacing: 1 }}>
              FAVORIT
            </motion.div>
          )}
        </motion.div>

        {/* Team 2 */}
        <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...SPRING, delay: 0.05 }}
          style={{
            flex: 1,
            background: isDark
              ? `linear-gradient(225deg, ${col2.bg} 0%, rgba(11,21,40,0.95) 100%)`
              : `linear-gradient(225deg, ${col2.bg} 0%, rgba(235,240,250,0.98) 100%)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '40px 20px 20px 40px',
          }}>
          <a href={`/teams/${t2.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: col2.bg, border: `2.5px solid ${col2.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: col2.border }}>
              {ini2}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>
                {shortName(t2.name).split(' ').slice(0, -1).join(' ') || shortName(t2.name)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: col2.border }}>
                {shortName(t2.name).split(' ').slice(-1)[0]}
              </div>
              {t2.city && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{t2.city}</div>}
            </div>
          </a>
          {overall === 2 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SPRING, delay: 0.6 }}
              style={{ fontSize: 9, fontWeight: 800, color: GOLD, background: GOLD_CARD,
                border: `1px solid ${GOLD_RING}`, borderRadius: 20, padding: '3px 10px', letterSpacing: 1 }}>
              FAVORIT
            </motion.div>
          )}
        </motion.div>

        {/* VS */}
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...SPRING, delay: 0.18 }}
          style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)',
            textAlign: 'center', fontSize: 20, fontWeight: 900, color: GOLD, letterSpacing: 3,
            textShadow: '0 0 12px rgba(245,194,0,0.9), 0 0 32px rgba(245,194,0,0.45)', zIndex: 10,
            pointerEvents: 'none', userSelect: 'none' as const }}>
          VS
        </motion.div>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 1, height: '100%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>

        {/* Category score strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.3 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            borderBottom: `1px solid ${C.border}`, padding: '10px 20px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 28, fontWeight: 900,
              color: overall === 1 ? GOLD : C.textMuted,
              textShadow: overall === 1 ? `0 0 16px ${GOLD_GLOW}` : 'none' }}>{t1Wins}</span>
          </div>
          <div style={{ textAlign: 'center', padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5 }}>VUNNA KATEGORIER</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 28, fontWeight: 900,
              color: overall === 2 ? GOLD : C.textMuted,
              textShadow: overall === 2 ? `0 0 16px ${GOLD_GLOW}` : 'none' }}>{t2Wins}</span>
          </div>
        </motion.div>

        {/* Win probability bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }}
          style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, textAlign: 'center', marginBottom: 10 }}>
            VINSTCHANS (baserat på säsongsform)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: col1.border, minWidth: 36, textAlign: 'right' }}>{prob1}%</span>
            <div style={{ flex: 1, height: 8, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden', position: 'relative' }}>
              <motion.div
                initial={{ width: '50%' }}
                animate={{ width: prob1 + '%' }}
                transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: col1.border, borderRadius: 8 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: col2.border, minWidth: 36 }}>{prob2}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: C.textMuted }}>{shortName(t1.name)}</span>
            <span style={{ fontSize: 10, color: C.textMuted }}>{shortName(t2.name)}</span>
          </div>
        </motion.div>

        {/* Column headers */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 110px 1fr', padding: '12px 20px 6px', gap: 8 }}>
          <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: col1.border,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortName(t1.name)}
          </div>
          <div />
          <div style={{ fontSize: 11, fontWeight: 700, color: col2.border,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortName(t2.name)}
          </div>
        </motion.div>

        {/* Metric rows */}
        {METRICS.map(({ label, key, lowerIsBetter, format }, i) => {
          const v1 = stats1[key] as number
          const v2 = stats2[key] as number
          const s1wins = lowerIsBetter ? v1 < v2 : v1 > v2
          const s2wins = lowerIsBetter ? v2 < v1 : v2 > v1
          const tied   = v1 === v2
          const fmt    = format ?? ((v: number) => String(v))

          return (
            <motion.div key={key}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.22 + i * 0.07 }}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 110px 1fr',
                alignItems: 'center', gap: 8,
                padding: '13px 20px',
                borderBottom: `1px solid ${C.border}`,
              }}>

              {/* Team 1 value */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <motion.span animate={{ scale: s1wins ? 1.05 : 1 }} transition={SPRING}
                  style={{ fontSize: s1wins ? 28 : 22, fontWeight: s1wins ? 900 : 400, lineHeight: 1,
                    color: s1wins ? GOLD : C.textMuted,
                    textShadow: s1wins ? `0 0 14px ${GOLD_GLOW}` : 'none',
                    transition: 'color 0.2s, font-size 0.2s' }}>
                  {v1 > 0 ? fmt(v1) : '—'}
                </motion.span>
                {s1wins && <span style={{ fontSize: 7, fontWeight: 800, color: GOLD, letterSpacing: 1 }}>▲ BÄST</span>}
              </div>

              {/* Label */}
              <div style={{ textAlign: 'center',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${tied && v1 > 0 ? 'rgba(245,194,0,0.30)' : C.border}`,
                borderRadius: 10, padding: '7px 6px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 0.3, lineHeight: 1.3 }}>
                  {label}
                </div>
                {tied && v1 > 0 && (
                  <div style={{ fontSize: 7, fontWeight: 800, color: GOLD, letterSpacing: 1, marginTop: 3 }}>LIKA</div>
                )}
              </div>

              {/* Team 2 value */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <motion.span animate={{ scale: s2wins ? 1.05 : 1 }} transition={SPRING}
                  style={{ fontSize: s2wins ? 28 : 22, fontWeight: s2wins ? 900 : 400, lineHeight: 1,
                    color: s2wins ? GOLD : C.textMuted,
                    textShadow: s2wins ? `0 0 14px ${GOLD_GLOW}` : 'none',
                    transition: 'color 0.2s, font-size 0.2s' }}>
                  {v2 > 0 ? fmt(v2) : '—'}
                </motion.span>
                {s2wins && <span style={{ fontSize: 7, fontWeight: 800, color: GOLD, letterSpacing: 1 }}>▲ BÄST</span>}
              </div>
            </motion.div>
          )
        })}

        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.22 + METRICS.length * 0.07 + 0.1 }}
          style={{ margin: '20px 20px 0', padding: '20px',
            background: GOLD_CARD, border: `1px solid ${GOLD_RING}`, borderRadius: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: GOLD, letterSpacing: 1.5, marginBottom: 8 }}>
            SAMMANTAGET
          </div>
          {overall !== 0 ? (
            <>
              <div style={{ fontSize: 19, fontWeight: 900, color: overall === 1 ? col1.border : col2.border }}>
                {shortName(overall === 1 ? t1.name : t2.name)}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 5 }}>
                är starkare — vinner {overall === 1 ? t1Wins : t2Wins}–{overall === 1 ? t2Wins : t1Wins} i kategorier
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 19, fontWeight: 900, color: GOLD }}>Jämnspelt!</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 5 }}>
                Lagen är lika starka i alla kategorier
              </div>
            </>
          )}
        </motion.div>

        {/* H2H direct meetings */}
        {h2h.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.22 + METRICS.length * 0.07 + 0.2 }}
            style={{ margin: '20px 20px 0', border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>

            {/* H2H header */}
            <div style={{ padding: '12px 16px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>
                DIREKTMÖTEN · {h2h.length} matcher
              </span>
              <div style={{ display: 'flex', gap: 10, fontSize: 12, fontWeight: 800 }}>
                <span style={{ color: h2hWins1 > h2hWins2 ? GOLD : C.textMuted }}>{h2hWins1}</span>
                <span style={{ color: C.textMuted, fontWeight: 400 }}>–</span>
                <span style={{ color: h2hDraws > 0 ? C.textMuted : 'transparent' }}>{h2hDraws > 0 ? h2hDraws : '·'}</span>
                <span style={{ color: C.textMuted, fontWeight: 400 }}>–</span>
                <span style={{ color: h2hWins2 > h2hWins1 ? GOLD : C.textMuted }}>{h2hWins2}</span>
              </div>
            </div>

            {/* Match rows */}
            {h2h.map((m, i) => {
              const isT1Home  = m.home_team_id === ids!.id1
              const t1Score   = isT1Home ? m.home_score! : m.away_score!
              const t2Score   = isT1Home ? m.away_score! : m.home_score!
              const t1Won     = t1Score > t2Score
              const t2Won     = t2Score > t1Score
              const dateStr   = m.date ? new Date(m.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
              return (
                <a key={m.id} href={`/matches/${m.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                    borderBottom: i < h2h.length - 1 ? `1px solid ${C.border}` : 'none',
                    textDecoration: 'none' }}>
                  <div style={{ fontSize: 11, color: C.textMuted, minWidth: 90 }}>{dateStr}</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: t1Won ? 900 : 500, color: t1Won ? col1.border : C.textMuted }}>{t1Score}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>–</span>
                    <span style={{ fontSize: 14, fontWeight: t2Won ? 900 : 500, color: t2Won ? col2.border : C.textMuted }}>{t2Score}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, minWidth: 60, textAlign: 'right' }}>
                    {isT1Home ? 'Hemma' : 'Borta'} ›
                  </div>
                </a>
              )
            })}
          </motion.div>
        )}

        {h2h.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            style={{ margin: '20px 20px 0', padding: '20px', textAlign: 'center',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${C.border}`, borderRadius: 18 }}>
            <div style={{ fontSize: 13, color: C.textMuted }}>Inga direktmöten registrerade</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, opacity: 0.7 }}>
              Lagen har inte mötts den här säsongen
            </div>
          </motion.div>
        )}

      </div>
    </main>
  )
}
