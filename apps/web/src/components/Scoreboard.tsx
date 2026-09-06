'use client'

import { useState } from 'react'
import { X, Plus, Delete } from 'lucide-react'
import { COLOR, FONT } from '@/lib/brand'
import { scoreGame, frameMarks, framesOf, maxNextRoll, isGameComplete, gameTotal, type Game } from '@bowlkollen/core'

const SURFACE = COLOR.surface, SURFACE2 = COLOR.surface2, INK = COLOR.ink, INK2 = COLOR.ink2, INK3 = COLOR.ink3, INK4 = COLOR.ink4, GOLD = COLOR.gold, GREEN = COLOR.green, HAIR = COLOR.hairline

// A ten-pin scoreboard for a session — one or more games, each scored live via
// @bowlkollen/core. Fill in practice / competition / league; onSave hands back the
// games (rolls + total) to attach to a logbook entry.
export function Scoreboard({ initial, onClose, onSave }: {
  initial?: Game[]
  onClose: () => void
  onSave: (games: Game[]) => void
}) {
  const [games, setGames] = useState<number[][]>(initial?.length ? initial.map(g => g.rolls) : [[]])
  const [gi, setGi] = useState(0)
  const rolls = games[gi]

  const setRolls = (next: number[]) => setGames(gs => gs.map((g, i) => (i === gi ? next : g)))
  const addRoll = (p: number) => { if (!isGameComplete(rolls)) setRolls([...rolls, p]) }
  const undo = () => setRolls(rolls.slice(0, -1))
  const addGame = () => { setGames(gs => [...gs, []]); setGi(games.length) }

  const mx = maxNextRoll(rolls)
  const over = isGameComplete(rolls)
  const { frames: cum } = scoreGame(rolls)
  const marks = frameMarks(rolls)
  const fs = framesOf(rolls)
  const lastDone = fs.length > 0 && (fs.length < 10 ? (fs[fs.length - 1][0] === 10 || fs[fs.length - 1].length === 2) : true)
  const active = over ? -1 : (fs.length === 0 ? 0 : lastDone ? fs.length : fs.length - 1)
  const onSecondBall = !over && fs.length > 0 && !lastDone && fs[fs.length - 1].length >= 1 && mx > 0 && mx < 10

  const save = () => onSave(games.filter(g => g.length > 0).map(g => ({ rolls: g, total: gameTotal(g) })))
  const sessionGames = games.filter(g => g.length > 0)
  const sessionTotal = sessionGames.reduce((a, g) => a + gameTotal(g), 0)

  const bxCls = (m: string): React.CSSProperties => ({ color: m === 'X' ? GOLD : m === '/' ? GREEN : INK })

  return (
    <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 600, background: COLOR.bg, borderRadius: '20px 20px 0 0', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
        {/* header + game tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 18px 10px' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: INK }}>Poängräkning</span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
            {games.map((_, i) => (
              <button key={i} onClick={() => setGi(i)} style={{ width: 30, height: 30, borderRadius: 999, cursor: 'pointer', fontFamily: FONT.body, fontWeight: 700, fontSize: 13,
                border: `1px solid ${i === gi ? SURFACE2 : INK4}`, background: i === gi ? SURFACE2 : 'transparent', color: i === gi ? INK : INK3 }}>{i + 1}</button>
            ))}
            <button onClick={addGame} aria-label="Nytt spel" style={{ border: 'none', background: 'none', color: INK3, cursor: 'pointer', fontSize: 20, padding: '0 4px' }}><Plus size={20} /></button>
          </div>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} aria-label="Stäng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={24} color={INK3} /></button>
        </div>

        {/* scoresheet */}
        <div style={{ overflowX: 'auto', padding: '4px 18px' }}>
          <div style={{ display: 'flex', minWidth: 'max-content', border: `1px solid ${HAIR}`, borderRadius: 10, overflow: 'hidden' }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const m = marks[i] ?? []
              const boxes = i === 9 ? 3 : 2
              return (
                <div key={i} style={{ width: i === 9 ? 74 : 52, borderRight: i < 9 ? `1px solid ${HAIR}` : 'none', background: i === active ? 'rgba(245,194,0,0.08)' : 'transparent' }}>
                  <div style={{ textAlign: 'center', fontSize: 11, color: INK4, fontWeight: 700, padding: '3px 0', borderBottom: `1px solid ${HAIR}` }}>{i + 1}</div>
                  <div style={{ display: 'flex', height: 26 }}>
                    {Array.from({ length: boxes }).map((_, b) => (
                      <div key={b} style={{ flex: 1, borderLeft: b > 0 ? `1px solid ${HAIR}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: FONT.score, fontSize: 15, fontWeight: 700, ...bxCls(m[b] ?? '') }}>{m[b] ?? ''}</div>
                    ))}
                  </div>
                  <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.score, fontSize: 19, fontWeight: 800, color: cum[i] === null ? INK4 : INK }}>
                    {cum[i] === null ? '' : cum[i]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* total */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 20px 4px' }}>
          <span style={{ fontFamily: FONT.score, fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: INK }}>{gameTotal(rolls)}</span>
          <span style={{ fontSize: 13, color: INK3 }}>{over ? `spel ${gi + 1} klart` : `spel ${gi + 1} · löpande`}{sessionGames.length > 1 ? ` · session ${sessionTotal}` : ''}</span>
        </div>

        {/* pad */}
        <div style={{ padding: '10px 18px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
            {Array.from({ length: 10 }).map((_, n) => (
              <button key={n} onClick={() => addRoll(n)} disabled={over || n > mx}
                style={{ height: 50, borderRadius: 12, border: 'none', cursor: over || n > mx ? 'default' : 'pointer', background: SURFACE2, color: INK, fontFamily: FONT.score, fontWeight: 700, fontSize: 20, opacity: over || n > mx ? 0.28 : 1 }}>
                {n === 0 ? '–' : n}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => addRoll(10)} disabled={over || mx < 10}
              style={{ flex: 1, height: 48, borderRadius: 12, border: 'none', cursor: over || mx < 10 ? 'default' : 'pointer', background: 'rgba(245,194,0,0.16)', color: GOLD, fontWeight: 800, fontSize: 15, opacity: over || mx < 10 ? 0.28 : 1 }}>Strike</button>
            <button onClick={() => addRoll(mx)} disabled={!onSecondBall}
              style={{ flex: 1, height: 48, borderRadius: 12, border: 'none', cursor: onSecondBall ? 'pointer' : 'default', background: 'rgba(48,212,126,0.14)', color: GREEN, fontWeight: 800, fontSize: 15, opacity: onSecondBall ? 1 : 0.28 }}>Spärr /</button>
            <button onClick={undo} disabled={rolls.length === 0}
              style={{ height: 48, padding: '0 16px', borderRadius: 12, border: `1px solid ${HAIR}`, background: 'none', color: INK2, cursor: rolls.length ? 'pointer' : 'default', opacity: rolls.length ? 1 : 0.4, display: 'flex', alignItems: 'center' }}><Delete size={20} /></button>
          </div>
          <button onClick={save} disabled={sessionGames.length === 0}
            style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 12, border: 'none', cursor: sessionGames.length ? 'pointer' : 'default', background: sessionGames.length ? GOLD : SURFACE2, color: sessionGames.length ? COLOR.bg : INK3, fontSize: 15, fontWeight: 800 }}>
            Klar{sessionGames.length > 1 ? ` · ${sessionGames.length} spel` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
