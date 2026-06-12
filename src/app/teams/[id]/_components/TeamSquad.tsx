'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { User } from 'lucide-react'
import { useColors } from '@/components/ThemeProvider'
import { usePlayerCheers } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { teamColor, teamInitials } from '@/lib/utils'
import type { Player, PlayerMomentum } from '@/lib/types'

type PlayerStat = { avg: number; matches: number; high: number }
type NodeColor   = { bg: string; border: string; text: string }

type Props = {
  teamId: string
  teamName: string
  players: Player[]
  playerStats: Record<string, PlayerStat>
  playerMomentum: Record<string, PlayerMomentum>
}

function nodeColor(p: Player, momentum: PlayerMomentum | undefined, isDark: boolean): NodeColor {
  if (!momentum || momentum.level === 'stable') return teamColor(p.name, isDark)
  if (momentum.level === 'rising') return {
    bg:     isDark ? 'rgba(34,197,94,0.16)' : 'rgba(34,197,94,0.12)',
    border: '#22c55e',
    text:   '#22c55e',
  }
  // slumping
  return {
    bg:     isDark ? 'rgba(100,116,139,0.16)' : 'rgba(100,116,139,0.10)',
    border: '#64748b',
    text:   isDark ? '#94a3b8' : '#64748b',
  }
}

const STEP    = 72
const AMP     = 38
const CY      = 90
const R       = 22
const SVG_H   = 185
const PAD     = R + 12
const BADGE_R = 8
const BDX     = R * 0.65
const BDY     = -R * 0.65

function buildPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i]
    const mx = (p.x + c.x) / 2
    d += ` C ${mx},${p.y} ${mx},${c.y} ${c.x},${c.y}`
  }
  return d
}

// CSS keyframes injected once — strand fade-in then perpetual breathing
const HELIX_STYLES = `
  @keyframes helix-a {
    0%   { opacity: 0; }
    20%  { opacity: 1; }
    55%  { opacity: 0.58; }
    100% { opacity: 1; }
  }
  @keyframes helix-b {
    0%   { opacity: 0; }
    18%  { opacity: 0.55; }
    55%  { opacity: 0.20; }
    100% { opacity: 0.55; }
  }
  .helix-strand-a { animation: helix-a 3.2s ease-in-out 0.1s infinite; }
  .helix-strand-b { animation: helix-b 3.8s ease-in-out 0s   infinite; }
`

export default function TeamSquad({ teamId, teamName, players, playerStats, playerMomentum }: Props) {
  const { C, isDark } = useColors()
  const [activeId,   setActiveId]   = useState<string | null>(null)
  const [cheeringId, setCheeringId] = useState<string | null>(null)

  const { data: cheerData, refetch: refetchCheers } = usePlayerCheers(teamId)
  const cheerCounts = cheerData?.counts ?? {}
  const myCheers    = cheerData?.mine   ?? new Set<string>()
  const userId      = cheerData?.userId ?? null

  const cheer = async (playerId: string) => {
    if (!userId) return
    setCheeringId(playerId)
    const supabase = createClient()
    if (myCheers.has(playerId)) {
      await supabase.from('player_cheers').delete()
        .eq('player_id', playerId).eq('user_id', userId)
    } else {
      await supabase.from('player_cheers').upsert({
        player_id: playerId, team_id: teamId, user_id: userId,
      })
    }
    await refetchCheers()
    setCheeringId(null)
  }

  // Find badge holders
  const withStats     = players.filter(p => (playerStats[p.id]?.avg ?? 0) > 0)
  const topAvgId      = [...withStats].sort((a, b) => (playerStats[b.id]?.avg     ?? 0) - (playerStats[a.id]?.avg     ?? 0))[0]?.id ?? null
  const mostMatchesId = [...withStats].sort((a, b) => (playerStats[b.id]?.matches ?? 0) - (playerStats[a.id]?.matches ?? 0))[0]?.id ?? null

  if (players.length === 0) {
    return (
      <section id="team-squad" style={{ scrollMarginTop: 60, borderTop: '1px solid ' + C.border }}>
        <div style={{ padding: '20px 20px 12px' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>TRUPPEN</span>
        </div>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <User size={28} color={C.muted} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Inga spelare registrerade</div>
          <div style={{ fontSize: 13, color: C.muted }}>Spelare läggs till via live scoring</div>
        </div>
      </section>
    )
  }

  const hue     = (teamName || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const strandA = isDark ? `hsl(${hue},58%,58%)` : `hsl(${hue},55%,38%)`
  const strandB = isDark ? `hsl(${hue},28%,30%)` : `hsl(${hue},28%,72%)`

  const nodes = players.map((_, i) => ({
    x: PAD + i * STEP,
    y: i % 2 === 0 ? CY - AMP : CY + AMP,
  }))
  const svgW  = PAD * 2 + (players.length - 1) * STEP
  const pathA = buildPath(nodes)
  const pathB = buildPath(nodes.map(n => ({ x: n.x, y: 2 * CY - n.y })))

  const activePlayer = players.find(p => p.id === activeId) ?? null
  const activeStat   = activeId ? playerStats[activeId] : undefined

  return (
    <section id="team-squad" style={{ scrollMarginTop: 60, borderTop: '1px solid ' + C.border }}>
      <style>{HELIX_STYLES}</style>

      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>TRUPPEN</span>
        <span style={{ fontSize: 11, color: C.muted }}>{players.length} spelare</span>
      </div>

      {/* ── Helix canvas ── */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 } as React.CSSProperties}>
        <svg width={svgW} height={SVG_H} style={{ display: 'block', overflow: 'visible' }}>

          {/* Strands — CSS-animated (reliable across framer-motion versions) */}
          <path className="helix-strand-b" d={pathB} fill="none" stroke={strandB} strokeWidth={2.5} strokeLinecap="round" />
          <path className="helix-strand-a" d={pathA} fill="none" stroke={strandA} strokeWidth={3.5} strokeLinecap="round" />

          {/* Crossing-point dots */}
          {nodes.slice(0, -1).map((n, i) => (
            <motion.circle key={'x' + i} cx={(n.x + nodes[i + 1].x) / 2} cy={CY} r={2.5}
              fill={strandA} initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
              transition={{ delay: 0.5 + i * 0.06 }} />
          ))}

          {/* Player nodes */}
          {players.map((p, i) => {
            const n        = nodes[i]
            const tc       = nodeColor(p, playerMomentum[p.id], isDark)
            const ini      = teamInitials(p.name).slice(0, 2)
            const isTop    = i % 2 === 0
            const isActive = activeId === p.id
            const label    = p.name.split(' ')[0].slice(0, 9)
            const delay    = 0.4 + i * 0.07
            const isCrown  = p.id === topAvgId
            const isFire   = p.id === mostMatchesId && p.id !== topAvgId
            const bx = n.x + BDX, by = n.y + BDY

            return (
              <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => setActiveId(isActive ? null : p.id)}>

                {/* Cheer glow — warm pulse when player has active cheers */}
                {(cheerCounts[p.id] ?? 0) > 0 && (
                  <motion.circle cx={n.x} cy={n.y} r={R + 11}
                    fill="#f97316" fillOpacity={0.18}
                    animate={{ r: [R + 9, R + 14, R + 9], fillOpacity: [0.18, 0.28, 0.18] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
                )}

                {/* Active ring */}
                <motion.circle cx={n.x} cy={n.y} r={R + 9}
                  fill="none" stroke={tc.border} strokeWidth={1.5}
                  animate={{ opacity: isActive ? 0.5 : 0 }}
                  transition={{ duration: 0.2 }} />

                {/* Node + initials — scale in from centre */}
                <motion.g
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' } as React.CSSProperties}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay, type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <circle cx={n.x} cy={n.y} r={R}
                    fill={tc.bg} stroke={isActive ? tc.text : tc.border}
                    strokeWidth={isActive ? 3 : 2.5} />
                  <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fontWeight={800} fill={tc.text}
                    style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'system-ui,sans-serif' }}>
                    {ini}
                  </text>
                </motion.g>

                {/* Name label */}
                <motion.text x={n.x} y={isTop ? n.y - R - 7 : n.y + R + 14}
                  textAnchor="middle" fontSize={9} fontWeight={isActive ? 800 : 600}
                  fill={isActive ? tc.text : C.muted}
                  style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'system-ui,sans-serif' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.12 }}>
                  {label}
                </motion.text>

                {/* Cheer count */}
                {(cheerCounts[p.id] ?? 0) > 0 && (
                  <motion.text
                    x={n.x} y={isTop ? n.y + R + 14 : n.y - R - 7}
                    textAnchor="middle" fontSize={8} fontWeight={700} fill="#f97316"
                    style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'system-ui,sans-serif' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3 }}>
                    🔥{cheerCounts[p.id]}
                  </motion.text>
                )}

                {/* Avg */}
                {(playerStats[p.id]?.avg ?? 0) > 0 && (
                  <motion.text x={n.x} y={isTop ? n.y - R - 19 : n.y + R + 26}
                    textAnchor="middle" fontSize={8} fontWeight={900} fill={C.accent}
                    style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'system-ui,sans-serif' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.2 }}>
                    {playerStats[p.id].avg}
                  </motion.text>
                )}

                {/* Crown badge */}
                {isCrown && (
                  <motion.g style={{ transformBox: 'fill-box', transformOrigin: 'center' } as React.CSSProperties}
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: delay + 0.4, type: 'spring', stiffness: 350, damping: 20 }}>
                    <circle cx={bx} cy={by} r={BADGE_R} fill="#f5c200" stroke={isDark ? '#1a1400' : '#fff'} strokeWidth={1.5} />
                    <text x={bx} y={by + 1} textAnchor="middle" dominantBaseline="middle"
                      fontSize={9} fontWeight={900} fill="#1a1400"
                      style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'system-ui,sans-serif' }}>★</text>
                  </motion.g>
                )}

                {/* Fire badge */}
                {isFire && (
                  <motion.g style={{ transformBox: 'fill-box', transformOrigin: 'center' } as React.CSSProperties}
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: delay + 0.4, type: 'spring', stiffness: 350, damping: 20 }}>
                    <circle cx={bx} cy={by} r={BADGE_R} fill="#ff6b2b" stroke={isDark ? '#1a1400' : '#fff'} strokeWidth={1.5} />
                    <text x={bx} y={by + 1} textAnchor="middle" dominantBaseline="middle"
                      fontSize={9} fontWeight={900} fill="#fff"
                      style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'system-ui,sans-serif' }}>▲</text>
                  </motion.g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* ── Tap-card ── */}
      <AnimatePresence>
        {activePlayer && (
          <motion.div key={activePlayer.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{ margin: '8px 20px 24px' }}>
            {(() => {
              const tc      = nodeColor(activePlayer, playerMomentum[activePlayer.id], isDark)
              const ini     = teamInitials(activePlayer.name).slice(0, 2)
              const isCrown = activePlayer.id === topAvgId
              const isFire  = activePlayer.id === mostMatchesId && activePlayer.id !== topAvgId
              return (
                <div style={{ background: tc.bg, border: '1.5px solid ' + tc.border, borderRadius: 20, padding: '18px', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: tc.border + '33', border: '2.5px solid ' + tc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: tc.text, flexShrink: 0 }}>
                    {ini}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activePlayer.name}</span>
                      {isCrown && <span style={{ fontSize: 9, background: '#f5c200', color: '#1a1400', borderRadius: 6, padding: '2px 7px', fontWeight: 800, flexShrink: 0 }}>★ Bäst snitt</span>}
                      {isFire  && <span style={{ fontSize: 9, background: '#ff6b2b', color: '#fff',    borderRadius: 6, padding: '2px 7px', fontWeight: 800, flexShrink: 0 }}>▲ Mest aktiv</span>}
                    </div>
                    {activeStat && activeStat.avg > 0 ? (
                      <div style={{ display: 'flex', gap: 14 }}>
                        {[
                          { v: activeStat.avg,     l: 'SNITT',   c: C.accent },
                          { v: activeStat.high,    l: 'BÄST',    c: C.text   },
                          { v: activeStat.matches, l: 'MATCHER', c: C.text   },
                        ].map(s => (
                          <div key={s.l}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</div>
                            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1, marginTop: 1 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: C.muted }}>Inga statistik än</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); cheer(activePlayer.id) }}
                      disabled={!userId || cheeringId === activePlayer.id}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: myCheers.has(activePlayer.id) ? '#f97316' + '30' : tc.border + '22',
                        border: '1.5px solid ' + (myCheers.has(activePlayer.id) ? '#f97316' : tc.border + '66'),
                        color: myCheers.has(activePlayer.id) ? '#f97316' : tc.text,
                        borderRadius: 12, padding: '7px 12px', fontSize: 12, fontWeight: 700,
                        cursor: userId ? 'pointer' : 'default', opacity: cheeringId === activePlayer.id ? 0.6 : 1,
                      }}>
                      🔥 {myCheers.has(activePlayer.id) ? `Hejar! ${cheerCounts[activePlayer.id] ?? 1}` : `Heja ${cheerCounts[activePlayer.id] ? '· ' + cheerCounts[activePlayer.id] : ''}`}
                    </button>
                    <Link href={'/players/' + activePlayer.id}
                      style={{ display: 'inline-flex', alignItems: 'center', background: tc.border, color: isDark ? '#111' : '#fff', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                      Profil →
                    </Link>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
