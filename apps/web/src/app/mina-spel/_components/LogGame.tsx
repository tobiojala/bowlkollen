'use client'

import { COLOR, FONT } from '@/lib/brand'
import { leaveName, isSplit, type Game } from '@bowlkollen/core'
import { PinDeck } from '@/components/PinDeck'
import { useLogGame } from './use-log-game'

const box = (m: string[], tenth: boolean): string[] =>
  tenth ? [m[0] ?? '', m[1] ?? '', m[2] ?? ''] : (m.length === 1 && m[0] === 'X' ? ['', 'X'] : [m[0] ?? '', m[1] ?? ''])

// Score one serie via the pin deck: each ball, tap the käglor that stood. Scores
// itself (via core) and captures open-frame leaves for Spärranalys. When the serie
// is done it's handed up via onComplete — the parent (SessionLogger) collects
// series and owns the save.
export function LogGame({ onComplete }: { onComplete: (game: Game) => void }) {
  const g = useLogGame()

  const stand = [...g.standing].sort((a, b) => a - b)
  const hal = isSplit(stand)
  const readout = stand.length === 0 ? (g.ball === 1 ? 'Strike' : 'Spärr') : leaveName(stand) + (hal ? '  ·  hål' : '')
  const readColor = stand.length === 0 && g.ball === 1 ? COLOR.gold : hal ? COLOR.red : COLOR.ink

  const add = () => { if (g.game) { onComplete(g.game); g.reset() } }

  return (
    <div>
      {/* scoreboard — compact, the current frame stays in view while you bowl */}
      <div style={{ overflowX: 'auto', margin: '0 -18px', padding: '0 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr) 1.5fr', minWidth: 500, border: `1px solid ${COLOR.hairline}`, borderRadius: 12, overflow: 'hidden' }}>
          {Array.from({ length: 10 }).map((_, f) => {
            const bx = box(g.marks[f] ?? [], f === 9), cur = f === g.frame && !g.done
            return (
              <div key={f} style={{ borderRight: f < 9 ? `1px solid ${COLOR.hairline}` : 'none', background: cur ? 'rgba(245,194,0,0.06)' : 'transparent' }}>
                <div style={{ fontSize: 10, color: COLOR.ink4, textAlign: 'center', padding: '3px 0', fontWeight: 700 }}>{f + 1}</div>
                <div style={{ display: 'flex', height: 26, borderTop: `1px solid ${COLOR.hairline}`, borderBottom: `1px solid ${COLOR.hairline}` }}>
                  {bx.map((m, k) => (
                    <div key={k} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.score, fontWeight: 700, fontSize: 14, borderLeft: k ? `1px solid ${COLOR.hairline}` : 'none', color: m === 'X' ? COLOR.gold : m === '–' ? COLOR.ink4 : COLOR.ink }}>{m}</div>
                  ))}
                </div>
                <div style={{ height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.score, fontWeight: 800, fontSize: 15, color: g.cum[f] == null ? COLOR.ink4 : COLOR.ink }}>{g.cum[f] ?? '·'}</div>
              </div>
            )
          })}
        </div>
      </div>

      {!g.done && (
        // Thumb-first: readout, then the deck, then Klar right under it — the whole
        // tap→confirm loop lives together, no scroll to score a ball.
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <span style={{ fontSize: 12, color: COLOR.ink4, textTransform: 'uppercase', letterSpacing: '.09em', fontWeight: 700 }}>Ruta {g.frame + 1} · Kast {g.ball}</span>
              <div style={{ fontFamily: FONT.score, fontWeight: 800, fontSize: 24, marginTop: 2, color: readColor }}>{readout}</div>
            </div>
            <span style={{ fontFamily: FONT.score, fontWeight: 800, fontSize: 28, letterSpacing: '-.03em', color: COLOR.ink }}>{g.total}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <PinDeck available={g.available} standing={g.standing} onToggle={g.toggle} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, maxWidth: 360, marginInline: 'auto' }}>
            <button onClick={g.confirm} style={{ flex: 2, border: 'none', cursor: 'pointer', fontFamily: FONT.body, fontWeight: 800, fontSize: 16, borderRadius: 12, padding: '15px 0', background: COLOR.ink, color: COLOR.bg }}>Klar</button>
            <button onClick={g.undo} disabled={!g.canUndo} style={{ flex: 1, border: 'none', cursor: g.canUndo ? 'pointer' : 'default', fontFamily: FONT.body, fontWeight: 700, fontSize: 15, borderRadius: 12, padding: '15px 0', background: 'transparent', color: COLOR.ink4, boxShadow: `inset 0 0 0 1px ${COLOR.hairline}`, opacity: g.canUndo ? 1 : .5 }}>Ångra</button>
          </div>
          <p style={{ fontSize: 12, color: COLOR.ink4, marginTop: 10, textAlign: 'center' }}>Tryck på käglorna som stod kvar. Inga kvar = strike / spärr.</p>
        </div>
      )}
      {g.done && (
        <div style={{ marginTop: 20, padding: 18, borderRadius: 14, background: COLOR.surface }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 20 }}>{g.total === 300 ? 'PERFEKT · 300!' : `Serie klar · ${g.total}`}</div>
          <p style={{ fontSize: 13, color: COLOR.ink3, marginTop: 6 }}>Lägg serien i loggen och räkna nästa, eller spara nedan.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={add} style={{ border: 'none', cursor: 'pointer', fontFamily: FONT.body, fontWeight: 700, fontSize: 15, borderRadius: 11, padding: '12px 22px', background: COLOR.gold, color: COLOR.bg }}>Lägg till serie</button>
            <button onClick={g.reset} style={{ border: 'none', cursor: 'pointer', fontFamily: FONT.body, fontWeight: 700, fontSize: 15, borderRadius: 11, padding: '12px 20px', background: 'transparent', color: COLOR.ink3, boxShadow: `inset 0 0 0 1px ${COLOR.hairline}` }}>Gör om</button>
          </div>
        </div>
      )}

      {g.leaves.filter(l => l.residual !== undefined && (l.converted || l.residual.length)).length > 0 && (
        <div style={{ marginTop: 26, borderTop: `1px solid ${COLOR.hairline}`, paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: COLOR.ink3, marginBottom: 10 }}>Lämningar denna serie</div>
          {g.leaves.filter(l => l.converted || l.residual.length).map((l, i) => {
            const nm = leaveName(l.pins), lh = isSplit(l.pins)
            const res = l.converted ? 'spärr ✓' : 'lämnade ' + [...l.residual].sort((a, b) => a - b).join('–')
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${COLOR.hairline}` : 'none', fontSize: 14 }}>
                <span style={{ fontFamily: FONT.score, fontWeight: 700, color: COLOR.ink4, width: 52, fontSize: 12 }}>RUTA {l.frame + 1}</span>
                <span style={{ fontFamily: FONT.score, fontWeight: 700, flex: 1 }}>{nm}{lh ? ' · hål' : ''}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: l.converted ? COLOR.green : lh ? COLOR.red : COLOR.ink3 }}>{res}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
