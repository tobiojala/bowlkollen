'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Sheet } from '@/components/mockup/Sheet'
import { FullCurve, MCFG, type Metric } from '@/components/mockup/Curves'
import { MATCHES, COLORS } from '../../data'

const { GOLD, GREEN, BLUE, MUTED } = COLORS

interface CurveSheetProps {
  matchAvgs: number[]
  seasonAvg: number
  formDiff: number
  onClose: () => void
}

export default function CurveSheet({ matchAvgs, seasonAvg, formDiff, onClose }: CurveSheetProps) {
  const [curveMetric, setCurveMetric] = useState<Metric>('snitt')
  const [curveTapped, setCurveTapped] = useState<number | null>(null)

  const curveTapM = curveTapped !== null ? MATCHES[curveTapped] : null

  return (
    <Sheet title="SÄSONGSKURVA" onClose={onClose}>
      {/* Metric selector */}
      <div className="flex gap-1.5 mb-4">
        {(Object.keys(MCFG) as Metric[]).map(m => (
          <button key={m} onClick={() => setCurveMetric(m)}
            className="flex-1 py-2 rounded-xl text-[10px] font-bold cursor-pointer"
            style={{
              background: curveMetric === m ? `${MCFG[m].color}18` : 'transparent',
              border: `1px solid ${curveMetric === m ? MCFG[m].color + '55' : 'rgba(255,255,255,0.1)'}`,
              color: curveMetric === m ? MCFG[m].color : MUTED,
            }}>
            {MCFG[m].label}
          </button>
        ))}
      </div>

      {/* Summary header */}
      <div className="flex justify-between items-center mb-3.5">
        <div>
          <span className="num text-2xl" style={{ color: GOLD }}>{seasonAvg}</span>
          {' '}<span className="text-sm" style={{ color: MUTED }}>snitt</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-bold"
          style={{ color: formDiff > 0 ? GREEN : '#e05555' }}>
          {formDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(formDiff)} p senaste 4 matcher
        </div>
      </div>

      <FullCurve matchAvgs={matchAvgs} seasonAvg={seasonAvg} metric={curveMetric} tapped={curveTapped} onTap={setCurveTapped} />

      {curveMetric === 'snitt' && (
        <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.28)' }}>
          Tryck på en punkt för matchinfo
        </p>
      )}

      {/* Tapped match detail — whitespace + dividers, no border boxes */}
      {curveTapM && (
        <div className="mt-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div>
              <p className="text-base font-bold">vs {curveTapM.opp}</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>{curveTapM.date}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: curveTapM.result.startsWith('W') ? 'rgba(93,202,165,0.12)' : curveTapM.result.startsWith('L') ? 'rgba(224,85,85,0.12)' : 'rgba(255,255,255,0.06)',
                color: curveTapM.result.startsWith('W') ? GREEN : curveTapM.result.startsWith('L') ? '#e05555' : MUTED,
                border: `1px solid ${curveTapM.result.startsWith('W') ? 'rgba(93,202,165,0.3)' : curveTapM.result.startsWith('L') ? 'rgba(224,85,85,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              {curveTapM.result}
            </span>
          </div>

          {/* Scores — no boxes */}
          <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${curveTapM.games.length}, 1fr)` }}>
            {curveTapM.games.map((g: number, i: number) => {
              const c = g >= 250 ? BLUE : g >= 200 ? GOLD : MUTED
              return (
                <div key={i} className="text-center">
                  <div className="num text-4xl" style={{ color: c }}>{g}</div>
                  <div className="text-[9px] mt-1 tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>SPEL {i + 1}</div>
                </div>
              )
            })}
          </div>

          {/* Summary — divider separation */}
          <div className="grid grid-cols-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <p className="text-[9px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>TOTALT</p>
              <p className="num text-2xl" style={{ color: GOLD }}>{curveTapM.games.reduce((a: number, b: number) => a + b)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>MATCHSNITT</p>
              <p className="num text-2xl" style={{ color: GOLD }}>{Math.round(curveTapM.games.reduce((a: number, b: number) => a + b) / curveTapM.games.length)}</p>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  )
}
