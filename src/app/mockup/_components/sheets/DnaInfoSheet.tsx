'use client'

import { Sheet } from '@/components/mockup/Sheet'
import { COLORS } from '../../data'
import type { ProfileHighlight } from '@/lib/profile'

const { GOLD } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

interface DnaInfoSheetProps {
  matchAvgs: number[]
  /** Number of matches (for the explainer copy). */
  matchCount: number
  /** Highlight markers placed on their matching spokes. */
  highlights?: readonly ProfileHighlight[]
  /** Center-glyph initials. */
  initials: string
  onClose: () => void
}

export default function DnaInfoSheet({ matchAvgs, matchCount, highlights = [], initials, onClose }: DnaInfoSheetProps) {
  const S = 280, LCX = S / 2, LCY = S / 2
  const lmn = Math.min(...matchAvgs), lmx = Math.max(...matchAvgs)
  const lSpokes = matchAvgs.map((avg, i) => {
    const angle = (2 * Math.PI * i / matchAvgs.length) - Math.PI / 2
    const r = 32 + ((avg - lmn) / (lmx === lmn ? 1 : lmx - lmn)) * 98
    return { x: LCX + r * Math.cos(angle), y: LCY + r * Math.sin(angle), r, angle }
  })
  const lPath    = lSpokes.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
  const bestIdx  = matchAvgs.indexOf(Math.max(...matchAvgs))
  const worstIdx = matchAvgs.indexOf(Math.min(...matchAvgs))

  return (
    <Sheet title="Bowling-DNA" subtitle="Ditt unika avtryck den här säsongen" onClose={onClose}>
      <p className="text-[13px] mb-6" style={{ color: INK2, lineHeight: 1.7 }}>
        Varje av de {matchCount} spetsarna är en match — ju längre spets, desto bättre form den dagen.
        Konturen ljusnar mot de senaste matcherna, så en spelare på uppgång lyser i kanten.
      </p>

      {/* Mini DNA chart */}
      <div className="flex justify-center mb-6">
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} className="dna-body" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="li_g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(245,194,0,0.20)" />
              <stop offset="100%" stopColor="rgba(245,194,0,0.03)" />
            </radialGradient>
            <filter id="li_glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {[32, 65, 98, 130].map(r => (
            <circle key={r} cx={LCX} cy={LCY} r={r} fill="none" stroke="rgba(244,245,247,0.07)" strokeWidth="1" />
          ))}
          {lSpokes.map((p, i) => (
            <line key={i} x1={LCX} y1={LCY} x2={p.x} y2={p.y} stroke="rgba(244,245,247,0.05)" strokeWidth="1" />
          ))}
          <path d={lPath} fill="url(#li_g)" filter="url(#li_glow)" />
          <path d={lPath} fill="none" stroke="rgba(245,194,0,0.72)" strokeWidth="2" />
          {lSpokes.map((p, i) => {
            const isBest  = i === bestIdx
            const isWorst = i === worstIdx
            const hl2     = highlights.find(h => h.idx === i)
            const color   = hl2 ? hl2.color : isBest ? GOLD : isWorst ? 'rgba(244,245,247,0.35)' : 'rgba(245,194,0,0.6)'
            const r       = hl2 || isBest ? 6 : isWorst ? 4 : 3
            return <circle key={i} cx={p.x} cy={p.y} r={r} fill={color} />
          })}
          {[bestIdx, worstIdx].map((idx, li) => {
            const p      = lSpokes[idx]
            const angle  = (2 * Math.PI * idx / matchAvgs.length) - Math.PI / 2
            const lx     = LCX + (p.r + 18) * Math.cos(angle)
            const ly     = LCY + (p.r + 18) * Math.sin(angle)
            const anchor: 'start' | 'end' | 'middle' = Math.cos(angle) > 0.25 ? 'start' : Math.cos(angle) < -0.25 ? 'end' : 'middle'
            return (
              <text key={li} x={lx} y={ly + 4} fill={li === 0 ? GOLD : 'rgba(244,245,247,0.4)'}
                fontSize="10" fontWeight="700" textAnchor={anchor}>
                {li === 0 ? 'Bäst' : 'Lägst'}
              </text>
            )
          })}
          <circle cx={LCX} cy={LCY} r={26} fill="#0b0d10" stroke="rgba(245,194,0,0.35)" strokeWidth="1.5" />
          <text x={LCX} y={LCY + 5} fill={GOLD} fontSize="13" fontWeight="900" textAnchor="middle">{initials}</text>
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5 pt-4" style={{ borderTop: '1px solid rgba(244,245,247,0.07)' }}>
        {[
          { l: 'Bästa form',  v: `${Math.max(...matchAvgs)}`, sub: 'snitt en match', c: GOLD },
          { l: 'Lägsta form', v: `${Math.min(...matchAvgs)}`, sub: 'snitt en match', c: INK3 },
          { l: 'Spann',       v: `${Math.max(...matchAvgs) - Math.min(...matchAvgs)}p`, sub: 'variation', c: INK },
        ].map(s => (
          <div key={s.l} className="text-center py-2">
            <div className="num text-2xl tabular-nums" style={{ color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div className="text-[11px] mt-1.5" style={{ color: INK3 }}>{s.l}</div>
            <div className="text-[11px] mt-0.5" style={{ color: INK4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(244,245,247,0.04)' }}>
        <p className="text-[13px]" style={{ color: INK2, lineHeight: 1.6 }}>
          Tryck på en spets i profilen för att se matchdetaljerna — poäng, motståndare och hur du presterade jämfört med ditt snitt.
        </p>
      </div>
    </Sheet>
  )
}
