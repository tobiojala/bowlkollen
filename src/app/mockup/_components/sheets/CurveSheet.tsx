'use client'

import { useState } from 'react'
import { Sheet } from '@/components/mockup/Sheet'
import { FullCurve, MCFG, type Metric } from '@/components/mockup/Curves'
import { COLORS } from '../../data'
import type { ProfileMatch, ProfileUpcoming } from '@/lib/profile'

const { GOLD, GREEN, RED } = COLORS
const INK  = '#f4f5f7'
const INK2 = 'rgba(244,245,247,0.64)'
const INK3 = 'rgba(244,245,247,0.40)'
const INK4 = 'rgba(244,245,247,0.24)'

interface CurveSheetProps {
  matchAvgs: number[]
  matches: ProfileMatch[]
  upcoming: ProfileUpcoming[]
  seasonAvg: number
  formDiff: number
  recentAvg: number
  initialMetric?: Metric
  onClose: () => void
}

export default function CurveSheet({ matchAvgs, matches, upcoming, seasonAvg, formDiff, recentAvg, initialMetric, onClose }: CurveSheetProps) {
  const [curveMetric, setCurveMetric] = useState<Metric>(initialMetric ?? 'snitt')
  const [curveTapped, setCurveTapped] = useState<number | null>(null)

  const curveTapM = curveTapped !== null ? matches[curveTapped] : null
  const scoreColor  = (g: number) => g >= 250 ? GOLD : g >= 200 ? INK : INK3
  const scoreWeight = (g: number) => g >= 250 ? 900 : g >= 200 ? 700 : 400

  return (
    <Sheet title="Säsongskurva" subtitle={`${matches.length} matcher denna säsong`} onClose={onClose}>

      {/* Hero — same pattern as the page */}
      <div className="flex items-baseline gap-3 mb-1">
        <span className="num" style={{ fontSize: 40, color: INK }}>{seasonAvg}</span>
        <span className="text-caption font-bold rounded-full px-2.5 py-1 tabular-nums"
          style={{ color: formDiff > 0 ? GREEN : RED, background: formDiff > 0 ? 'rgba(93,202,165,0.10)' : 'rgba(224,85,85,0.10)' }}>
          {formDiff > 0 ? '+' : ''}{formDiff} form
        </span>
      </div>
      <p className="text-[13px] mb-5" style={{ color: INK3 }}>senaste 4 matcher mot säsongssnittet</p>

      {/* Metric selector — neutral pills, color only as a dot */}
      <div className="flex gap-1.5 mb-4">
        {(Object.keys(MCFG) as Metric[]).map(m => {
          const active = curveMetric === m
          return (
            <button key={m} onClick={() => setCurveMetric(m)}
              className="flex-1 min-h-[40px] rounded-full text-[13px] font-semibold cursor-pointer border-none
                         flex items-center justify-center gap-1.5 transition-colors duration-150"
              style={{
                background: active ? INK : 'rgba(244,245,247,0.06)',
                color: active ? '#0b0d10' : INK3,
              }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: MCFG[m].color,
                opacity: active ? 1 : 0.45, flexShrink: 0 }} />
              {MCFG[m].label}
            </button>
          )
        })}
      </div>

      <FullCurve matchAvgs={matchAvgs} seasonAvg={seasonAvg} metric={curveMetric}
        tapped={curveTapped} onTap={setCurveTapped}
        upcoming={upcoming} recentAvg={recentAvg} />

      {/* Ghost fan legend */}
      {curveMetric === 'snitt' && (
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="rgba(245,194,0,0.55)" strokeWidth="1.5" strokeDasharray="4,3" /></svg>
            <span className="text-[12px]" style={{ color: INK3 }}>om formen håller · <span className="tabular-nums font-semibold" style={{ color: INK2 }}>{recentAvg}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="rgba(244,245,247,0.28)" strokeWidth="1.5" strokeDasharray="4,3" /></svg>
            <span className="text-[12px]" style={{ color: INK3 }}>om snittet håller · <span className="tabular-nums font-semibold" style={{ color: INK2 }}>{seasonAvg}</span></span>
          </div>
        </div>
      )}

      {curveMetric === 'snitt' && !curveTapM && (
        <p className="text-[12px] text-center mt-3" style={{ color: INK4 }}>
          Tryck på en punkt för matchinfo
        </p>
      )}

      {/* Tapped match detail */}
      {curveTapM && (
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(244,245,247,0.07)' }}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <p className="text-[15px] font-bold">vs {curveTapM.opp}</p>
              <p className="text-[12px] mt-0.5" style={{ color: INK3 }}>{curveTapM.date}</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full text-[13px] font-bold"
              style={{
                background: curveTapM.result.startsWith('W') ? 'rgba(93,202,165,0.12)' : curveTapM.result.startsWith('L') ? 'rgba(224,85,85,0.12)' : 'rgba(244,245,247,0.06)',
                color: curveTapM.result.startsWith('W') ? GREEN : curveTapM.result.startsWith('L') ? RED : INK3,
              }}>
              {curveTapM.result}
            </span>
          </div>

          <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${curveTapM.games.length}, 1fr)` }}>
            {curveTapM.games.map((g: number, i: number) => (
              <div key={i} className="text-center">
                <div className="num text-4xl" style={{ color: scoreColor(g), fontWeight: scoreWeight(g) }}>{g}</div>
                <div className="text-[11px] mt-1.5" style={{ color: INK4 }}>Spel {i + 1}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 pt-4" style={{ borderTop: '1px solid rgba(244,245,247,0.07)' }}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: INK3 }}>Totalt</p>
              <p className="num text-2xl" style={{ color: INK }}>{curveTapM.games.reduce((a: number, b: number) => a + b)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: INK3 }}>Matchsnitt</p>
              <p className="num text-2xl" style={{ color: INK2 }}>{Math.round(curveTapM.games.reduce((a: number, b: number) => a + b) / curveTapM.games.length)}</p>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  )
}
