'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { motion } from 'framer-motion'
import { shortName, teamColor } from '@/lib/utils'

type Props = { params: Promise<{ id1: string; id2: string }> }

type Player = {
  id: string; name: string; team_id: string | null; avatar_url: string | null
}

type Stats = {
  avg: number
  bestSeries: number
  bestGame: number
  over200: number
  over250: number
  matches: number
  totalGames: number
}

type Metric = {
  label: string
  key: keyof Stats
  format?: (v: number) => string
}

const METRICS: Metric[] = [
  { label: 'Snitt',         key: 'avg' },
  { label: 'Bästa serie',   key: 'bestSeries' },
  { label: 'Högsta spel',   key: 'bestGame' },
  { label: '200+ spel',     key: 'over200' },
  { label: '250+ spel',     key: 'over250' },
  { label: 'Matcher',       key: 'matches' },
]

const SPRING     = { type: 'spring', stiffness: 280, damping: 28 } as const
const TEAL       = '#f5c200'
const TEAL_GLOW  = 'rgba(245,194,0,0.40)'
const TEAL_CARD  = 'rgba(245,194,0,0.08)'
const TEAL_RING  = 'rgba(245,194,0,0.28)'

function computeStats(results: any[]): Stats {
  const allGames = results.flatMap((r: any) => (r.games || []).filter((g: number) => g > 0))
  const seriesTotals = results
    .map((r: any) => (r.games || []).filter((g: number) => g > 0).reduce((a: number, b: number) => a + b, 0))
    .filter((t: number) => t > 0)
  return {
    avg:        allGames.length > 0 ? Math.round(allGames.reduce((a: number, b: number) => a + b, 0) / allGames.length) : 0,
    bestSeries: seriesTotals.length > 0 ? Math.max(...seriesTotals) : 0,
    bestGame:   allGames.length > 0 ? Math.max(...allGames) : 0,
    over200:    allGames.filter((g: number) => g >= 200).length,
    over250:    allGames.filter((g: number) => g >= 250).length,
    matches:    results.length,
    totalGames: allGames.length,
  }
}

function Avatar({ player, tc, tclo }: { player: Player; tc: string; tclo: string }) {
  const ini = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return player.avatar_url ? (
    <img src={player.avatar_url} alt={player.name}
      style={{ width: 68, height: 68, borderRadius: '50%', border: `2.5px solid ${tc}`, objectFit: 'cover' }} />
  ) : (
    <div style={{ width: 68, height: 68, borderRadius: '50%', background: tclo, border: `2.5px solid ${tc}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: tc }}>
      {ini}
    </div>
  )
}

export default function ComparePage({ params }: Props) {
  const { theme } = useTheme()
  const C       = theme === 'dark' ? dark : light
  const isDark  = theme === 'dark'

  const [ids,     setIds]     = useState<{ id1: string; id2: string } | null>(null)
  const [p1,      setP1]      = useState<Player | null>(null)
  const [p2,      setP2]      = useState<Player | null>(null)
  const [team1,   setTeam1]   = useState<{ name: string } | null>(null)
  const [team2,   setTeam2]   = useState<{ name: string } | null>(null)
  const [stats1,  setStats1]  = useState<Stats | null>(null)
  const [stats2,  setStats2]  = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { params.then(p => setIds(p)) }, [params])

  useEffect(() => {
    if (!ids) return
    const supabase = createClient()
    Promise.all([
      supabase.from('players').select('id,name,team_id,avatar_url').eq('id', ids.id1).single(),
      supabase.from('players').select('id,name,team_id,avatar_url').eq('id', ids.id2).single(),
      supabase.from('match_results').select('games').eq('player_id', ids.id1),
      supabase.from('match_results').select('games').eq('player_id', ids.id2),
    ]).then(async ([{ data: player1 }, { data: player2 }, { data: r1 }, { data: r2 }]) => {
      if (player1) {
        setP1(player1 as Player)
        if (player1.team_id) {
          const { data: t } = await supabase.from('teams').select('name').eq('id', player1.team_id).single()
          if (t) setTeam1(t)
        }
      }
      if (player2) {
        setP2(player2 as Player)
        if (player2.team_id) {
          const { data: t } = await supabase.from('teams').select('name').eq('id', player2.team_id).single()
          if (t) setTeam2(t)
        }
      }
      setStats1(r1 ? computeStats(r1) : null)
      setStats2(r2 ? computeStats(r2) : null)
      setLoading(false)
    })
  }, [ids])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
        style={{ fontSize: 13, color: C.textMuted }}>Laddar jämförelse...</motion.div>
    </main>
  )

  if (!p1 || !p2 || !stats1 || !stats2) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: C.textMuted }}>Spelare hittades inte</div>
    </main>
  )

  const col1 = teamColor(p1.name, isDark)
  const col2 = teamColor(p2.name, isDark)

  const p1Wins = METRICS.filter(m => (stats1[m.key] as number) > (stats2[m.key] as number)).length
  const p2Wins = METRICS.filter(m => (stats2[m.key] as number) > (stats1[m.key] as number)).length
  const overall = p1Wins > p2Wins ? 1 : p2Wins > p1Wins ? 2 : 0

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* ─── Back ─── */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
        <a href="/players" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
          background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '5px 12px' }}>
          ← Tillbaka
        </a>
      </div>

      {/* ─── Split-screen hero ─── */}
      <div style={{ position: 'relative', height: 230, display: 'flex', overflow: 'hidden' }}>

        {/* Player 1 half */}
        <motion.div
          initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ ...SPRING, delay: 0.05 }}
          style={{
            flex: 1,
            background: isDark
              ? `linear-gradient(135deg, ${col1.bg} 0%, rgba(11,21,40,0.95) 100%)`
              : `linear-gradient(135deg, ${col1.bg} 0%, rgba(235,240,250,0.98) 100%)`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '40px 40px 20px 20px',
          }}>
          <Avatar player={p1} tc={col1.border} tclo={col1.bg} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>
              {p1.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: col1.border, lineHeight: 1.3 }}>
              {p1.name.split(' ').slice(1).join(' ')}
            </div>
            {team1 && (
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>
                {shortName(team1.name)}
              </div>
            )}
          </div>
          {overall === 1 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SPRING, delay: 0.6 }}
              style={{ fontSize: 9, fontWeight: 800, color: TEAL, background: TEAL_CARD,
                border: `1px solid ${TEAL_RING}`, borderRadius: 20, padding: '3px 10px', letterSpacing: 1 }}>
              VINNER
            </motion.div>
          )}
        </motion.div>

        {/* Player 2 half */}
        <motion.div
          initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ ...SPRING, delay: 0.05 }}
          style={{
            flex: 1,
            background: isDark
              ? `linear-gradient(225deg, ${col2.bg} 0%, rgba(11,21,40,0.95) 100%)`
              : `linear-gradient(225deg, ${col2.bg} 0%, rgba(235,240,250,0.98) 100%)`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '40px 20px 20px 40px',
          }}>
          <Avatar player={p2} tc={col2.border} tclo={col2.bg} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>
              {p2.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: col2.border, lineHeight: 1.3 }}>
              {p2.name.split(' ').slice(1).join(' ')}
            </div>
            {team2 && (
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>
                {shortName(team2.name)}
              </div>
            )}
          </div>
          {overall === 2 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SPRING, delay: 0.6 }}
              style={{ fontSize: 9, fontWeight: 800, color: TEAL, background: TEAL_CARD,
                border: `1px solid ${TEAL_RING}`, borderRadius: 20, padding: '3px 10px', letterSpacing: 1 }}>
              VINNER
            </motion.div>
          )}
        </motion.div>

        {/* VS label — floats dead-center */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING, delay: 0.18 }}
          style={{
            position: 'absolute', top: '50%', left: 0, right: 0,
            transform: 'translateY(-50%)',
            textAlign: 'center',
            fontSize: 20, fontWeight: 900, color: '#f5c200',
            letterSpacing: 3,
            textShadow: '0 0 12px rgba(245,194,0,0.9), 0 0 32px rgba(245,194,0,0.45)',
            zIndex: 10,
            pointerEvents: 'none',
            userSelect: 'none' as const,
          }}>
          VS
        </motion.div>

        {/* Divider line */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: 1, height: '100%',
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }} />
      </div>

      {/* ─── Score strip ─── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          borderBottom: `1px solid ${C.border}`,
          padding: '10px 20px',
        }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 900,
            color: overall === 1 ? TEAL : C.textMuted,
            textShadow: overall === 1 ? `0 0 16px ${TEAL_GLOW}` : 'none' }}>
            {p1Wins}
          </span>
        </div>
        <div style={{ textAlign: 'center', padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.5 }}>VUNNA KATEGORIER</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 900,
            color: overall === 2 ? TEAL : C.textMuted,
            textShadow: overall === 2 ? `0 0 16px ${TEAL_GLOW}` : 'none' }}>
            {p2Wins}
          </span>
        </div>
      </motion.div>

      {/* ─── Stats grid ─── */}
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>

        {/* Column headers */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 96px 1fr',
            padding: '12px 20px 6px', gap: 8,
          }}>
          <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: col1.border,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p1.name.split(' ')[0]}
          </div>
          <div />
          <div style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: col2.border,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p2.name.split(' ')[0]}
          </div>
        </motion.div>

        {/* Metric rows */}
        {METRICS.map(({ label, key }, i) => {
          const v1 = stats1[key] as number
          const v2 = stats2[key] as number
          const s1wins = v1 > v2 && v1 > 0
          const s2wins = v2 > v1 && v2 > 0
          const tied   = v1 === v2 && v1 > 0

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.22 + i * 0.075 }}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 96px 1fr',
                alignItems: 'center', gap: 8,
                padding: '13px 20px',
                borderBottom: `1px solid ${C.border}`,
                background: s1wins || s2wins
                  ? isDark ? 'rgba(0,229,204,0.025)' : 'rgba(0,229,204,0.02)'
                  : 'transparent',
              }}>

              {/* ── Left: player 1 stat ── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <motion.span
                  animate={{ scale: s1wins ? 1.05 : 1 }}
                  transition={SPRING}
                  style={{
                    fontSize: s1wins ? 28 : 22,
                    fontWeight: s1wins ? 900 : 400,
                    color: s1wins ? TEAL : tied ? C.textMuted : C.textMuted,
                    textShadow: s1wins ? `0 0 14px ${TEAL_GLOW}` : 'none',
                    lineHeight: 1,
                    transition: 'color 0.2s, font-size 0.2s',
                  }}>
                  {v1 > 0 ? v1 : '—'}
                </motion.span>
                {s1wins && (
                  <span style={{ fontSize: 7, fontWeight: 800, color: TEAL, letterSpacing: 1 }}>▲ BÄST</span>
                )}
              </div>

              {/* ── Center: metric label ── */}
              <div style={{
                textAlign: 'center',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${tied ? 'rgba(245,194,0,0.30)' : C.border}`,
                borderRadius: 10, padding: '7px 6px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 0.3, lineHeight: 1.3 }}>
                  {label}
                </div>
                {tied && (
                  <div style={{ fontSize: 7, fontWeight: 800, color: '#f5c200', letterSpacing: 1, marginTop: 3 }}>
                    LIKA
                  </div>
                )}
              </div>

              {/* ── Right: player 2 stat ── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <motion.span
                  animate={{ scale: s2wins ? 1.05 : 1 }}
                  transition={SPRING}
                  style={{
                    fontSize: s2wins ? 28 : 22,
                    fontWeight: s2wins ? 900 : 400,
                    color: s2wins ? TEAL : tied ? C.textMuted : C.textMuted,
                    textShadow: s2wins ? `0 0 14px ${TEAL_GLOW}` : 'none',
                    lineHeight: 1,
                    transition: 'color 0.2s, font-size 0.2s',
                  }}>
                  {v2 > 0 ? v2 : '—'}
                </motion.span>
                {s2wins && (
                  <span style={{ fontSize: 7, fontWeight: 800, color: TEAL, letterSpacing: 1 }}>▲ BÄST</span>
                )}
              </div>
            </motion.div>
          )
        })}

        {/* ─── Summary card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.22 + METRICS.length * 0.075 + 0.12 }}
          style={{
            margin: '20px 20px 0',
            padding: '20px',
            background: overall !== 0 ? TEAL_CARD : isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.05)',
            border: `1px solid ${overall !== 0 ? TEAL_RING : 'rgba(245,194,0,0.30)'}`,
            borderRadius: 18,
            textAlign: 'center',
          }}>
          {overall !== 0 ? (
            <>
              <div style={{ fontSize: 9, fontWeight: 800, color: TEAL, letterSpacing: 1.5, marginBottom: 8 }}>
                SAMMANTAGET RESULTAT
              </div>
              <div style={{ fontSize: 19, fontWeight: 900, color: overall === 1 ? col1.border : col2.border }}>
                {overall === 1 ? p1.name : p2.name}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 5 }}>
                vinner {overall === 1 ? p1Wins : p2Wins}–{overall === 1 ? p2Wins : p1Wins} i kategorier
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#f5c200', letterSpacing: 1.5, marginBottom: 8 }}>
                SAMMANTAGET RESULTAT
              </div>
              <div style={{ fontSize: 19, fontWeight: 900, color: '#f5c200' }}>Jämnspelt!</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 5 }}>
                Båda spelarna är lika starka — {p1Wins}–{p2Wins}
              </div>
            </>
          )}
        </motion.div>
      </div>

    </main>
  )
}
