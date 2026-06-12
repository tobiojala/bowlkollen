'use client'

import { Sheet } from '@/components/mockup/Sheet'
import { DNA_HIGHLIGHTS, MATCHES, COLORS } from '../../data'

const { GOLD, BLUE, GREEN, MUTED } = COLORS

interface DnaInfoSheetProps {
  matchAvgs: number[]
  onClose: () => void
}

export default function DnaInfoSheet({ matchAvgs, onClose }: DnaInfoSheetProps) {
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
    <Sheet title="BOWLING DNA" onClose={onClose}>
      <p className="text-sm mb-6" style={{ color: MUTED, lineHeight: 1.75 }}>
        Ditt DNA är ett <span className="text-white font-semibold">unikt avtryck</span> skapat från dina {MATCHES.length} matcher denna säsong.
        Varje av de {MATCHES.length} spetsarna representerar en match. Ju längre spetsen, desto bättre var din form den dagen.
      </p>

      {/* Mini DNA chart */}
      <div className="flex justify-center mb-6">
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} className="dna-body" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="li_g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(245,194,0,0.26)" />
              <stop offset="100%" stopColor="rgba(245,194,0,0.03)" />
            </radialGradient>
            <filter id="li_glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {[32, 65, 98, 130].map(r => (
            <circle key={r} cx={LCX} cy={LCY} r={r} fill="none" stroke="rgba(245,194,0,0.12)" strokeWidth="1" />
          ))}
          {lSpokes.map((p, i) => (
            <line key={i} x1={LCX} y1={LCY} x2={p.x} y2={p.y} stroke="rgba(245,194,0,0.08)" strokeWidth="1" />
          ))}
          <path d={lPath} fill="url(#li_g)" filter="url(#li_glow)" />
          <path d={lPath} fill="none" stroke="rgba(245,194,0,0.72)" strokeWidth="2" />
          {lSpokes.map((p, i) => {
            const isBest  = i === bestIdx
            const isWorst = i === worstIdx
            const hl2     = DNA_HIGHLIGHTS.find(h => h.idx === i)
            const color   = hl2 ? hl2.color : isBest ? GOLD : isWorst ? 'rgba(160,175,200,0.5)' : 'rgba(245,194,0,0.65)'
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
              <text key={li} x={lx} y={ly + 4} fill={li === 0 ? GOLD : 'rgba(255,255,255,0.4)'}
                fontSize="10" fontWeight="700" textAnchor={anchor}>
                {li === 0 ? 'Bäst' : 'Lägst'}
              </text>
            )
          })}
          <circle cx={LCX} cy={LCY} r={26} fill="#141e2e" stroke="rgba(245,194,0,0.35)" strokeWidth="1.5" />
          <text x={LCX} y={LCY + 5} fill={GOLD} fontSize="13" fontWeight="900" textAnchor="middle">SH</text>
        </svg>
      </div>

      {/* Stats — dividers not boxes */}
      <div className="grid grid-cols-3 gap-2 mb-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { l: 'BÄSTA FORM',  v: `${Math.max(...matchAvgs)}`, sub: 'snitt en match', c: GOLD },
          { l: 'LÄGSTA FORM', v: `${Math.min(...matchAvgs)}`, sub: 'snitt en match', c: MUTED },
          { l: 'SPANN',       v: `${Math.max(...matchAvgs) - Math.min(...matchAvgs)}p`, sub: 'variation', c: BLUE },
        ].map(s => (
          <div key={s.l} className="text-center py-2">
            <div className="num text-xl" style={{ color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div className="text-[8px] mt-1 tracking-widest" style={{ color: MUTED }}>{s.l}</div>
            <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="px-4 py-3 rounded-xl" style={{
        background: 'rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${GOLD}`,
      }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>
          Tryck på en spets i profilen för att se matchdetaljerna — poäng, motståndare och hur du presterade jämfört med ditt snitt.
        </p>
      </div>
    </Sheet>
  )
}
