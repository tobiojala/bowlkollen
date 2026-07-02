'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { COLOR, FONT } from '@/lib/brand'
import { useDivisionMatches } from '@/lib/queries'
import { isoWeekStart } from '@/app/schema/_components/week'
import { PinGlyph } from '@/app/schema/_components/pin'
import type { Match } from '@/app/schema/_components/types'
import type { MapDivision } from './SverigeMosaic'

type Props = { division: MapDivision; onClose: () => void }
type Lens  = 'rounds' | 'teams'

type Round = { key: string; label: string; firstDate: string; matches: Match[]; played: boolean }

const MONTH_SE = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const todayStr = new Date().toISOString().slice(0, 10)

function alpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}
function shortDate(d: string): string {
  return `${+d.slice(8, 10)} ${MONTH_SE[+d.slice(5, 7) - 1]}`
}
function teamInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase()
}

/** A tapped division square, split open: its omgångar as squares (never
 * dates — a round is a thing), or the Lag lens: every team a square that
 * splits into its own win/loss heat. The deepest squares are matches. */
export function DivisionSquares({ division, onClose }: Props) {
  const { data: matches = [], isLoading } = useDivisionMatches(division.id)
  const [lens, setLens]         = useState<Lens>('rounds')
  const [openRound, setOpenRound] = useState<string | null>(null)
  const [openTeam, setOpenTeam]   = useState<string | null>(null)

  const rounds = useMemo<Round[]>(() => {
    const map = new Map<string, Match[]>()
    for (const m of matches) {
      const key = m.roundId != null ? String(m.roundId) : isoWeekStart(m.matchDate.slice(0, 10))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    const list = [...map.entries()].map(([key, ms]) => {
      const firstDate = ms.reduce((a, m) => (m.matchDate < a ? m.matchDate : a), ms[0].matchDate).slice(0, 10)
      return { key, firstDate, matches: ms, played: ms.every(m => m.isFinished) }
    })
    list.sort((a, b) => a.firstDate.localeCompare(b.firstDate))
    return list.map((r, i) => ({ ...r, label: `Omg ${i + 1}` }))
  }, [matches])

  // The pin stands on "now": the first round that isn't fully played.
  const currentRoundKey = rounds.find(r => !r.played)?.key ?? null

  const teams = useMemo(() => {
    const map = new Map<string, { name: string; w: number; l: number; d: number }>()
    for (const m of matches) {
      for (const name of [m.homeTeamName, m.awayTeamName]) {
        if (name && !map.has(name)) map.set(name, { name, w: 0, l: 0, d: 0 })
      }
      if (!m.isFinished || m.homeScore == null || m.awayScore == null) continue
      const h = map.get(m.homeTeamName), a = map.get(m.awayTeamName)
      if (!h || !a) continue
      if (m.homeScore > m.awayScore) { h.w++; a.l++ }
      else if (m.homeScore < m.awayScore) { a.w++; h.l++ }
      else { h.d++; a.d++ }
    }
    return [...map.values()].sort((x, y) => y.w - x.w || x.name.localeCompare(y.name, 'sv'))
  }, [matches])

  const c = division.color

  const MatchSquare = ({ m, perspective }: { m: Match; perspective?: string }) => {
    const done = m.isFinished && m.homeScore != null
    let edge = alpha(c, 0.35)
    if (perspective && done) {
      const my  = m.homeTeamName === perspective ? m.homeScore! : m.awayScore!
      const opp = m.homeTeamName === perspective ? m.awayScore! : m.homeScore!
      edge = my > opp ? COLOR.green : my < opp ? COLOR.red : COLOR.ink4
    }
    return (
      <Link href={`/matcher/${m.bitsMatchId}`} style={{ textDecoration: 'none' }}>
        <div style={{ borderRadius: 10, padding: '8px 9px', height: '100%',
          background: alpha(c, 0.07), border: `1px solid ${edge}`,
          display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 9, color: COLOR.ink3 }}>
            {shortDate(m.matchDate.slice(0, 10))}{m.hallName ? ` · ${m.hallName}` : ''}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink, lineHeight: 1.25 }}>
            {m.homeTeamName}
            {done
              ? <span style={{ fontFamily: FONT.display, fontWeight: 900, color: COLOR.ink }}> {m.homeScore}–{m.awayScore} </span>
              : <span style={{ color: COLOR.ink4 }}> – </span>}
            {m.awayTeamName}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <motion.div layoutId={`karta-div-${division.id}`}
      style={{ height: '100%', display: 'flex', flexDirection: 'column',
        borderRadius: 16, background: COLOR.surface,
        border: `1px solid ${alpha(c, 0.4)}`, overflow: 'hidden', margin: '0 8px 8px' }}>

      {/* Division header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 8px', flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 22, fontWeight: 900, color: c, letterSpacing: -0.4 }}>
            {division.name}
          </div>
          <div style={{ fontSize: 10, color: COLOR.ink3 }}>
            {rounds.length} omgångar · {teams.length} lag
          </div>
        </div>
        {(['rounds', 'teams'] as const).map(l => (
          <button key={l} onClick={() => { setLens(l); setOpenRound(null); setOpenTeam(null) }}
            style={{ background: lens === l ? COLOR.surface2 : 'none', border: 'none',
              borderRadius: 100, padding: '5px 11px', fontSize: 10, fontWeight: 800,
              letterSpacing: 1, color: lens === l ? COLOR.ink : COLOR.ink4,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
            {l === 'rounds' ? 'OMGÅNGAR' : 'LAG'}
          </button>
        ))}
        <button onClick={onClose} aria-label="Zooma ut"
          style={{ background: 'none', border: 'none', color: COLOR.ink3, fontSize: 15,
            cursor: 'pointer', padding: 4, WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
          ✕
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 12px 80px' }}>
        {isLoading && <div style={{ padding: 24, fontSize: 12, color: COLOR.ink3 }}>Laddar…</div>}

        {/* ── Omgångar lens — every square is a round ─────────────────────── */}
        {!isLoading && lens === 'rounds' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {rounds.map(r => {
              const isOpen  = openRound === r.key
              const isPin   = r.key === currentRoundKey
              const isLive  = !r.played && r.matches.some(m => m.matchDate.slice(0, 10) === todayStr)
              if (isOpen) return (
                <motion.div key={r.key} layoutId={`karta-rd-${division.id}-${r.key}`}
                  style={{ width: '100%', borderRadius: 12, background: alpha(c, 0.08),
                    border: `1px solid ${alpha(c, 0.5)}`, padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: FONT.display, fontSize: 17, fontWeight: 900, color: c }}>
                      {r.label}
                    </span>
                    <span style={{ fontSize: 10, color: COLOR.ink3 }}>{shortDate(r.firstDate)}</span>
                    <button onClick={() => setOpenRound(null)}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none',
                        color: COLOR.ink3, fontSize: 13, cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                      ✕
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                    {r.matches.map(m => <MatchSquare key={m.bitsMatchId} m={m} />)}
                  </div>
                </motion.div>
              )
              return (
                <motion.button key={r.key} layoutId={`karta-rd-${division.id}-${r.key}`}
                  onClick={() => setOpenRound(r.key)} whileTap={{ scale: 0.92 }}
                  style={{ width: 66, height: 66, borderRadius: 12, position: 'relative',
                    background: alpha(c, r.played ? 0.06 : 0.18),
                    border: `1px solid ${isPin ? COLOR.gold : alpha(c, r.played ? 0.2 : 0.5)}`,
                    boxShadow: isLive ? `0 0 12px ${alpha(COLOR.gold, 0.5)}`
                      : isPin ? `0 0 10px ${alpha(COLOR.gold, 0.3)}` : 'none',
                    opacity: r.played ? 0.55 : 1, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 1,
                    WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                  {isPin && (
                    <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)' }}>
                      <PinGlyph size={12} />
                    </div>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 900, color: r.played ? COLOR.ink3 : c }}>
                    {r.label}
                  </span>
                  <span style={{ fontSize: 8.5, color: COLOR.ink4 }}>{shortDate(r.firstDate)}</span>
                  <span style={{ fontSize: 8.5, color: COLOR.ink4 }}>{r.matches.length} matcher</span>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* ── Lag lens — every square is a team; open one → W/L heat ───────── */}
        {!isLoading && lens === 'teams' && (
          <AnimatePresence mode="popLayout" initial={false}>
            {openTeam == null ? (
              <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {teams.map(t => (
                  <motion.button key={t.name} layoutId={`karta-tm-${division.id}-${t.name}`}
                    onClick={() => setOpenTeam(t.name)} whileTap={{ scale: 0.92 }}
                    style={{ width: 82, height: 82, borderRadius: 12,
                      background: alpha(c, 0.1), border: `1px solid ${alpha(c, 0.35)}`,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 2, padding: 4,
                      WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                    <span style={{ fontFamily: FONT.display, fontSize: 17, fontWeight: 900, color: c }}>
                      {teamInitials(t.name)}
                    </span>
                    <span style={{ fontSize: 8, color: COLOR.ink3, textAlign: 'center',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                      {t.name}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700 }}>
                      <span style={{ color: COLOR.green }}>{t.w}V</span>
                      {t.d > 0 && <span style={{ color: COLOR.ink4 }}> {t.d}O</span>}
                      <span style={{ color: COLOR.red }}> {t.l}F</span>
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div key={'team-' + openTeam} layoutId={`karta-tm-${division.id}-${openTeam}`}
                style={{ borderRadius: 12, background: alpha(c, 0.07),
                  border: `1px solid ${alpha(c, 0.4)}`, padding: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: FONT.display, fontSize: 18, fontWeight: 900, color: c }}>
                    {openTeam}
                  </span>
                  <button onClick={() => setOpenTeam(null)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none',
                      color: COLOR.ink3, fontSize: 13, cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                    ✕
                  </button>
                </div>
                {/* The team's season as squares: green = win, red = loss */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {matches
                    .filter(m => m.homeTeamName === openTeam || m.awayTeamName === openTeam)
                    .sort((a, b) => a.matchDate.localeCompare(b.matchDate))
                    .map(m => <MatchSquare key={m.bitsMatchId} m={m} perspective={openTeam} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
